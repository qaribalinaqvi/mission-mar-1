from __future__ import annotations

import argparse
from pathlib import Path
import sys

DEFAULT_MOLA_TIF_PATH = Path(
    r"C:\Users\Ahmad\Downloads\mola128_mola64_merge_90Nto90S_SimpleC_clon0.tif"
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_GLOBAL_DEM_PATH = DATA_DIR / "mars_global_dem.npy"

# Global raster resolution: 720 rows x 1440 cols
# Latitude spans +90.0° (row 0) to -90.0° (row 719) at 0.25°/cell
# Longitude spans -180.0° (col 0) to +180.0° (col 1439) at 0.25°/cell
TARGET_ROWS = 720
TARGET_COLS = 1440


def process_global_dem(tif_path: Path, output_path: Path) -> None:
    """Read MOLA Global GeoTIFF with decimation and export a clean 720x1440 float32 array."""
    try:
        import numpy as np
        import rasterio
        from rasterio.enums import Resampling
    except ImportError as exc:
        print(
            f"ERROR: Missing geospatial dependency: {exc}.\n"
            "Note: 'rasterio' is an offline data preparation dependency.\n"
            "Install it via:\n"
            "    pip install rasterio",
            file=sys.stderr,
        )
        sys.exit(1)

    if not tif_path.is_file():
        print(f"ERROR: Source MOLA GeoTIFF not found at: {tif_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Opening Global MOLA GeoTIFF: {tif_path.name}...")
    with rasterio.open(tif_path) as src:
        print(f"Source raster dimensions: {src.width} x {src.height}, CRS: {src.crs}")
        print(f"Bounds: Left={src.bounds.left:.2f}, Bottom={src.bounds.bottom:.2f}, Right={src.bounds.right:.2f}, Top={src.bounds.top:.2f}")

        # Stream downsampled 720x1440 window using average decimation
        print(f"Downsampling to {TARGET_ROWS} x {TARGET_COLS} (0.25°/cell) via Resampling.average...")
        dem = src.read(
            1,
            out_shape=(TARGET_ROWS, TARGET_COLS),
            resampling=Resampling.average,
        ).astype(np.float32)

        # Sanitize any NoData or unphysical Martian elevations (< -10000m or > 30000m)
        invalid_mask = (dem < -10000.0) | (dem > 30000.0) | np.isnan(dem)
        invalid_count = int(np.sum(invalid_mask))
        if invalid_count > 0:
            print(f"Sanitizing {invalid_count} unphysical/NoData cells...")
            median_val = float(np.median(dem[~invalid_mask]))
            dem[invalid_mask] = median_val

        output_path.parent.mkdir(parents=True, exist_ok=True)
        np.save(output_path, dem)

        file_size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"SUCCESS: Saved Global DEM to {output_path}")
        print(f"Array Shape: {dem.shape} (dtype: {dem.dtype}), File Size: {file_size_mb:.2f} MB")
        print(f"Elevation Range: {dem.min():.1f} m (Hellas Planitia) to {dem.max():.1f} m (Olympus Mons)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare downsampled global Martian MOLA elevation grid.")
    parser.add_argument(
        "--tif",
        type=Path,
        default=DEFAULT_MOLA_TIF_PATH,
        help="Path to downloaded MOLA Global GeoTIFF file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_GLOBAL_DEM_PATH,
        help="Output path for the compiled NumPy array (.npy).",
    )
    args = parser.parse_args()
    process_global_dem(args.tif, args.output)
