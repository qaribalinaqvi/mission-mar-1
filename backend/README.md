# Martian Map: Planetary Traversal & Obstacle Avoidance API

> **NASA Space Apps Challenge 2026** — Planetary-Scale Surface Traversal Engine for Mars.  
> Powered by the full-resolution **NASA MGS MOLA Global Elevation Dataset (463 m/pixel)** via memory-mapped NumPy arrays.

---

## 1. Project Overview & Architectural Mission

Human extravehicular activities (EVAs) and autonomous rover expeditions on Mars face extreme terrain hazards:
- **Vertical Escarpments**: Valles Marineris drops up to 7,000 meters; Olympus Mons features 6,000-meter sheer flanks.
- **Biomechanical Slope Ceilings**: Incline angles $> 8.0^\circ\text{--}15.0^\circ$ increase metabolic consumption, suit joint fatigue, and rover rollover risks. Gradients $> 22.0^\circ$ represent impassable barriers.
- **Science Return**: Missions must survey key astrobiological targets (USGS lakebed mudstones, delta remnants, volcanic provinces) without taking hazardous detours.

**Martian Map** is a streamlined Python/FastAPI backend focused on **obstacle-avoiding A\* pathfinding** across any coordinate pair on the Martian globe (Latitude $-90.0^\circ$ to $+90.0^\circ$, Longitude $-180.0^\circ$ to $+180.0^\circ$).

### Key Architectural Pillars:
1. **Memory-Mapped Global Elevation (`mars_mola_dem.npy`)**: Slices arbitrary geographic windows directly from the $23,040 \times 46,080$ native array in microseconds with $\approx 0\text{ MB}$ RAM footprint.
2. **Zero-GDAL/Rasterio Runtime**: Converted ahead-of-time via `convert_mola.py`. The production API relies solely on lightweight `fastapi`, `uvicorn`, `numpy`, and `pydantic`.
3. **Raw, Unsmoothed A\* Output**: Preserves the exact cell-by-cell path directly from the digital elevation grid, exposing every terrain detour, ridge traversal, and elevation sample without artificial smoothing.

---

## 2. Dataset Pipeline & Conversion (`convert_mola.py`)

- **Source Dataset**: Official NASA/USGS Mars Global Surveyor (MGS) Mars Orbiter Laser Altimeter (MOLA) MEGDR GeoTIFF:
  `mola128_mola64_merge_90Nto90S_SimpleC_clon0.tif` ($46,081 \times 23,041$ pixels, $\approx 2.1\text{ GB}$).
- **Conversion Utility**: `convert_mola.py` reads the 2 GB GeoTIFF in streaming $2,000$-row chunks using `rasterio` and writes directly to disk via `np.lib.format.open_memmap`:
  - **Output Binary**: `data/mars_mola_dem.npy` ($23,040 \times 46,080$, `int16`, $1.98\text{ GB}$).
  - **Elevation Range**: $-8,201\text{ m}$ (Hellas Basin) to $+21,241\text{ m}$ (Olympus Mons summit).
  - **Metadata**: `data/mars_mola_meta.json`.

```bash
# Convert source GeoTIFF to memory-mapped NumPy binary
python convert_mola.py
```

---

## 3. Windowed Memory-Mapped Terrain Slicing (`terrain.py`)

When a routing request arrives, `load_route_window(start, end)`:
1. Computes a padded bounding box around the endpoints:
   $$\text{pad} = \max(1.0^\circ, 0.40 \times \max(|\Delta \text{lat}|, |\Delta \text{lon}|))$$
2. Maps decimal degrees directly into row/col indices:
   $$r = \left\lfloor \frac{90.0 - \text{lat}}{180.0} \times (23,040 - 1) \right\rceil, \quad c = \left\lfloor \frac{\text{lon} - (-180.0)}{360.0} \times (46,080 - 1) \right\rceil$$
3. Slices the exact window from `MOLA_MMAP` in microseconds.
4. If the sliced window is $\le 300 \times 300$ cells (e.g. Jezero Crater or Gale Crater), **100% of native 463 m/pixel cells** are kept untouched.
5. If larger than $300 \times 300$, it is strided cleanly to $\le 300 \times 300$ so A\* finishes in under $40\text{ ms}$.
6. Adjusts metric cell dimensions using the center latitude cosine foreshortening:
   $$\text{cell\_width\_m} = \frac{\text{radians}(\Delta \text{lon})}{W - 1} \times R_{\text{Mars}} \times \cos(\text{radians}(\text{center\_lat}))$$
   where $R_{\text{Mars}} = 3,389,500\text{ m}$.

---

## 4. Raw Obstacle-Avoiding 3-Mode A* (`router_engine.py`)

### 1. Metric Slope Calculation
Between adjacent cells $(r_1, c_1)$ and $(r_2, c_2)$:
$$d_{\text{horizontal}} = \sqrt{((r_2 - r_1) \times \text{cell\_height\_m})^2 + ((c_2 - c_1) \times \text{cell\_width\_m})^2}$$
$$\Delta z = \text{elev}[r_2, c_2] - \text{elev}[r_1, c_1]$$
$$\theta = \arctan\left(\frac{|\Delta z|}{d_{\text{horizontal}}}\right) \times \frac{180^\circ}{\pi}$$

### 2. Profile Cost Functions

| Profile | Max Slope Ceiling | Cost Formulation | Trajectory Character |
| :--- | :--- | :--- | :--- |
| **`safest`** | **$8.0^\circ$** *(auto-relaxes to $14.0^\circ$ only if blocked)* | $d + d \times \left(\frac{\theta}{2.0}\right)^3 \times 4.0 + \max(0, \Delta z) \times 18.0 + |\Delta z| \times 8.0$ | Strongly avoids climbs; detours around crater rims and ridges through gentle valley passes. |
| **`science`** | **$12.0^\circ$** | $\left[d \times \left(1 + \left(\frac{\theta}{3.5}\right)^2 \times 3.0\right) + |\Delta z| \times 6.0\right] \times \text{disc}$ | Multiplied by **$0.40$ (60% discount)** within $1.5^\circ$ of landmarks (Jezero, Gale, Olympus Mons, Valles Marineris, Elysium, Hellas). |
| **`fastest`** | **$22.0^\circ$** | $d + |\Delta z| \times 0.5$ | Prioritizes shortest distance while strictly blocking sheer cliffs ($>22^\circ$). |

### 3. Safety Verdict Classification
- **`SAFE`**: Maximum route slope $\le 6.0^\circ$.
- **`CAUTION`**: $6.0^\circ < \text{max\_slope} \le 15.0^\circ$.
- **`NO-GO`**: Maximum route slope $> 15.0^\circ$ or terrain blocked by sheer cliffs.

---

## 5. Setup & Local Execution Guide

### 1. Requirements & Virtual Environment
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

*(Production runtime dependencies: `fastapi`, `uvicorn`, `numpy`, `pydantic`).*

### 2. Verify or Generate Memory-Mapped DEM
Ensure `data/mars_mola_dem.npy` exists. If regenerating:
```bash
pip install rasterio
python convert_mola.py
```

### 3. Start the API Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI documentation is available at `http://localhost:8000/docs`.

---

## 6. Complete API Reference

### 1. Health & Elevation Array Telemetry
- **Method**: `GET`
- **Path**: `/`

**Response (`200 OK`):**
```json
{
  "status": "online",
  "dem_file": "mars_mola_dem.npy",
  "shape": [23040, 46080],
  "resolution_m": 463.0,
  "planetary_bounds": {
    "lat": [-90.0, 90.0],
    "lon": [-180.0, 180.0]
  }
}
```

---

### 2. Plan Route
- **Method**: `POST`
- **Path**: `/api/plan-route`

#### Request Payload:
```json
{
  "start": [18.35, 77.35],
  "end": [18.52, 77.52],
  "mode": "safest"
}
```

#### Response Payload (`200 OK`):
```json
{
  "mode_used": "safest",
  "verdict": "SAFE",
  "reason": "[SAFEST] Safe corridor verified. Max incline 3.0° is within nominal limits.",
  "total_distance_m": 21325.4,
  "elevation_gain_m": 17.0,
  "max_slope_deg": 3.0,
  "est_eva_minutes": 426.5,
  "dem_source": "NASA MGS MOLA Global DEM (463m/px)",
  "waypoints": [
    {
      "lat": 18.35,
      "lng": 77.35,
      "elevation_m": -2534.0,
      "slope_deg": 0.0
    },
    {
      "lat": 18.355648,
      "lng": 77.357821,
      "elevation_m": -2533.0,
      "slope_deg": 0.2
    },
    {
      "lat": 18.52,
      "lng": 77.52,
      "elevation_m": -2512.0,
      "slope_deg": 1.4
    }
  ]
}
```

---

*Authored for the NASA Space Apps Challenge 2026.*
