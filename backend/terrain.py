from __future__ import annotations

from dataclasses import dataclass
import json
import math
from pathlib import Path
from typing import Any
import numpy as np

# Mean volumetric radius of Mars (meters) as defined by NASA/IAU working groups
MARS_RADIUS_M: float = 3389500.0

DATA_DIR: Path = Path(__file__).resolve().parent / "data"
MOLA_NPY_PATH: Path = DATA_DIR / "mars_mola_dem.npy"
MOLA_META_PATH: Path = DATA_DIR / "mars_mola_meta.json"

if not MOLA_NPY_PATH.is_file():
    raise FileNotFoundError(
        f"Memory-mapped MOLA DEM not found at '{MOLA_NPY_PATH}'. "
        "Run 'convert_mola.py' to generate the 463 m/px array from the source GeoTIFF."
    )

# Memory-map the 2.1 GB global DEM in read-only mode (takes ~0 MB resident RAM)
MOLA_MMAP: np.ndarray = np.load(MOLA_NPY_PATH, mmap_mode="r")
TOTAL_ROWS: int
TOTAL_COLS: int
TOTAL_ROWS, TOTAL_COLS = MOLA_MMAP.shape

# Cached planetary metadata
if MOLA_META_PATH.is_file():
    with open(MOLA_META_PATH, "r", encoding="utf-8") as f:
        MOLA_META: dict[str, Any] = json.load(f)
else:
    MOLA_META = {
        "source": "NASA MGS MOLA MEGDR 128px/deg (463 m/px)",
        "shape": [TOTAL_ROWS, TOTAL_COLS],
        "native_resolution_m": 463.0,
        "lat_min": -90.0,
        "lat_max": 90.0,
        "lon_min": -180.0,
        "lon_max": 180.0,
    }


@dataclass
class TerrainGrid:
    """In-memory 2D raster window sliced directly from the memory-mapped MOLA global array."""

    elevation: np.ndarray  # 2D float32 array
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    cell_height_m: float
    cell_width_m: float
    rows: int
    cols: int

    def latlng_to_rc(self, lat: float, lng: float) -> tuple[int, int]:
        """Convert decimal planetary coordinates into discrete matrix indices (row, col)."""
        lat_c = max(self.lat_min, min(self.lat_max, lat))
        lng_c = max(self.lon_min, min(self.lon_max, lng))
        r = int((self.lat_max - lat_c) / (self.lat_max - self.lat_min) * (self.rows - 1))
        c = int((lng_c - self.lon_min) / (self.lon_max - self.lon_min) * (self.cols - 1))
        return max(0, min(self.rows - 1, r)), max(0, min(self.cols - 1, c))

    def rc_to_latlng(self, r: float | int, c: float | int) -> tuple[float, float]:
        """Convert matrix coordinates (row, col) back to decimal planetary degrees."""
        r_c = max(0.0, min(float(self.rows - 1), float(r)))
        c_c = max(0.0, min(float(self.cols - 1), float(c)))
        lat = self.lat_max - (r_c / (self.rows - 1)) * (self.lat_max - self.lat_min)
        lng = self.lon_min + (c_c / (self.cols - 1)) * (self.lon_max - self.lon_min)
        return round(lat, 6), round(lng, 6)


def is_valid_mars_coord(lat: float, lng: float) -> bool:
    """Validate whether geographic coordinates fall within legitimate planetary boundaries."""
    return (-90.0 <= lat <= 90.0) and (-180.0 <= lng <= 180.0)


def load_route_window(start: list[float], end: list[float]) -> TerrainGrid:
    """Slice a windowed bounding box around start and end points from MOLA_MMAP.
    
    If the sliced window is <= 300x300 cells (e.g., Jezero Crater, Gale Crater, Olympus Mons summit),
    100% of the native 463 m/pixel cells are kept untouched.
    Larger multi-thousand kilometer continental traverses are cleanly strided to <= 300x300
    so A* pathfinding finishes in under 40 milliseconds.
    """
    lat1, lon1 = start[0], start[1]
    lat2, lon2 = end[0], end[1]

    d_lat = abs(lat2 - lat1)
    d_lon = abs(lon2 - lon1)
    pad = max(1.0, 0.40 * max(d_lat, d_lon))

    lat_min = max(-89.9, min(lat1, lat2) - pad)
    lat_max = min(89.9, max(lat1, lat2) + pad)
    lon_min = max(-180.0, min(lon1, lon2) - pad)
    lon_max = min(180.0, max(lon1, lon2) + pad)

    r_min = int((90.0 - lat_max) / 180.0 * (TOTAL_ROWS - 1))
    r_max = int((90.0 - lat_min) / 180.0 * (TOTAL_ROWS - 1)) + 1
    c_min = int((lon_min - (-180.0)) / 360.0 * (TOTAL_COLS - 1))
    c_max = int((lon_max - (-180.0)) / 360.0 * (TOTAL_COLS - 1)) + 1

    r_min = max(0, min(TOTAL_ROWS - 1, r_min))
    r_max = max(r_min + 1, min(TOTAL_ROWS, r_max))
    c_min = max(0, min(TOTAL_COLS - 1, c_min))
    c_max = max(c_min + 1, min(TOTAL_COLS, c_max))

    # Slice directly from memory-map in microseconds
    raw_slice = MOLA_MMAP[r_min:r_max, c_min:c_max]
    h_raw, w_raw = raw_slice.shape

    # Stride only if window exceeds 300x300 to bound A* search space
    if h_raw > 300 or w_raw > 300:
        stride = max(int(math.ceil(h_raw / 300)), int(math.ceil(w_raw / 300)))
        elevation = raw_slice[::stride, ::stride].astype(np.float32)
    else:
        elevation = raw_slice.astype(np.float32)

    rows, cols = elevation.shape

    center_lat = (lat_min + lat_max) / 2.0
    cell_h_m = (math.radians(lat_max - lat_min) / max(1, rows - 1)) * MARS_RADIUS_M
    cell_w_m = (math.radians(lon_max - lon_min) / max(1, cols - 1)) * MARS_RADIUS_M * math.cos(math.radians(center_lat))
    cell_w_m = max(1.0, cell_w_m)
    cell_h_m = max(1.0, cell_h_m)

    return TerrainGrid(
        elevation=elevation,
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        cell_height_m=cell_h_m,
        cell_width_m=cell_w_m,
        rows=rows,
        cols=cols,
    )
