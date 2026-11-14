from __future__ import annotations

import json
from pathlib import Path
import time
import numpy as np
import rasterio
from rasterio.windows import Window

TIF_PATH = Path(r"C:\Users\Ahmad\Downloads\mola128_mola64_merge_90Nto90S_SimpleC_clon0.tif")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_NPY = DATA_DIR / "mars_mola_dem.npy"
OUTPUT_META = DATA_DIR / "mars_mola_meta.json"

TARGET_ROWS = 23040
TARGET_COLS = 46080
CHUNK_ROWS = 2000


def convert_geotiff_to_memmap() -> None:
    if not TIF_PATH.is_file():
        raise FileNotFoundError(f"Source MOLA GeoTIFF not found at: {TIF_PATH}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Opening source GeoTIFF: {TIF_PATH}")
    t0 = time.time()

    with rasterio.open(TIF_PATH) as src:
        print(f"GeoTIFF size: {src.width} x {src.height}, CRS: {src.crs}")
        print(f"Target memory-mapped array: {TARGET_ROWS} rows x {TARGET_COLS} cols, int16 (~2.1 GB)")

        mmap_arr = np.lib.format.open_memmap(
            OUTPUT_NPY,
            mode="w+",
            dtype=np.int16,
            shape=(TARGET_ROWS, TARGET_COLS),
        )

        global_min = 32767
        global_max = -32768
        total_cleaned = 0

        for r_start in range(0, TARGET_ROWS, CHUNK_ROWS):
            r_count = min(CHUNK_ROWS, TARGET_ROWS - r_start)
            window = Window(0, r_start, TARGET_COLS, r_count)
            chunk = src.read(1, window=window)

            # Sanitize invalid / NoData pixels
            invalid_mask = (chunk < -15000) | (chunk > 30000)
            cleaned_count = int(np.sum(invalid_mask))
            if cleaned_count > 0:
                chunk[invalid_mask] = 0
                total_cleaned += cleaned_count

            valid_chunk = chunk[~invalid_mask] if cleaned_count > 0 else chunk
            if valid_chunk.size > 0:
                global_min = min(global_min, int(valid_chunk.min()))
                global_max = max(global_max, int(valid_chunk.max()))

            mmap_arr[r_start : r_start + r_count, :] = chunk.astype(np.int16)
            progress = (r_start + r_count) / TARGET_ROWS * 100
            print(f"  Processed rows {r_start}:{r_start + r_count} ({progress:.1f}%)")

        mmap_arr.flush()
        del mmap_arr

    elapsed = time.time() - t0
    file_size_gb = OUTPUT_NPY.stat().st_size / (1024 ** 3)
    print(f"\nSUCCESS: Created {OUTPUT_NPY.name} ({file_size_gb:.2f} GB) in {elapsed:.2f} seconds")
    print(f"Elevation Range: {global_min} m (Hellas Basin) to {global_max} m (Olympus Mons)")
    print(f"Sanitized NoData pixels: {total_cleaned}")

    metadata = {
        "source": "NASA MGS MOLA MEGDR 128px/deg (463 m/px)",
        "shape": [TARGET_ROWS, TARGET_COLS],
        "dtype": "int16",
        "lat_min": -90.0,
        "lat_max": 90.0,
        "lon_min": -180.0,
        "lon_max": 180.0,
        "native_resolution_m": 463.0,
        "mars_radius_m": 3389500.0,
        "elevation_min_m": global_min,
        "elevation_max_m": global_max,
        "created_at_epoch": time.time(),
    }

    with open(OUTPUT_META, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {OUTPUT_META}")


if __name__ == "__main__":
    convert_geotiff_to_memmap()
