# 🔴 Martian Map // Planetary Surface Explorer & EVA Mission Control

> **NASA Space Apps Challenge 2026** — Planetary-Scale Autonomous Traversal & Bio-Energetic Pathfinding Console for Mars.  
> Powered by verified **NASA JPL Mars Trek WMTS** endpoints, **USGS Astrogeology catalogs**, and high-performance **A* pathfinding** via FastAPI.

---

## 1. Project Overview & Mission Scope

Human extravehicular activities (EVAs) and robotic rover surface operations on Mars face severe geographic and physical constraints:
* **Extreme Escarpments**: Valles Marineris plunges over $7,000\text{ meters}$; Olympus Mons rises with $6,000\text{ m}$ sheer volcanic cliffs.
* **Biomechanic Slope Limits**: Inclines exceeding $8.0^\circ\text{--}15.0^\circ$ significantly increase metabolic consumption, spacesuit joint torque saturation, and rover rollover risk.
* **Consumable & Science Trade-offs**: Traverses must balance safety with routing incentives near critical astrobiological outcrops (USGS ancient lakebeds, delta deposits, river channels).

**Martian Map** is an industry-grade, precision-engineered React + Leaflet GIS console that renders global planetary topography and computes energy-optimal, slope-constrained routes across the Martian globe.

---

## 2. NASA & USGS Orbital Datasets (WMTS)

## 2. NASA Orbital Datasets Used for Map Image Fetching

The frontend fetches planetary satellite imagery and topographic tiles in real-time from the official **NASA Jet Propulsion Laboratory (JPL) Mars Trek Web Map Tile Service (WMTS)**. All tiles are served in Equirectangular cylindrical projection (`EPSG:4326`, $R_{\text{Mars}} = 3,389.5\text{ km}$) using standard $256 \times 256$ pixel grids.

### Summary Table

| Layer Name | Source Mission & Sensor | Processing Agency | Ground Resolution | Native Zooms | File Format | Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Optical Mosaic** | NASA Viking 1 & 2 Orbiters (VIS) | USGS Astrogeology Science Center | **232 m / px** (64 px/deg) | Zoom 0–7 | JPEG | Global (90°S to 90°N) |
| **Elevation Relief** | NASA MGS Mars Orbiter Laser Altimeter (MOLA) | NASA GSFC / USGS | **463 m / px** (128 px/deg) | Zoom 0–7 | JPEG | Global (90°S to 90°N) |
| **Thermal Surface** | 2001 Mars Odyssey THEMIS Day IR | ASU Mars Space Flight Facility / USGS | **100 m / px** | Zoom 0–9 | PNG | Sub-polar (65°S to 65°N) |

---

### In-Depth Dataset Descriptions & WMTS Endpoints

#### 1. NASA Viking Orbiter MDIM 2.1 (Optical True-Color Mosaic)
* **Dataset Identifier**: `Mars_Viking_MDIM21_ClrMosaic_global_232m`
* **Mission & Instrument**: NASA Viking Orbiters 1 & 2 — Visual Imaging Subsystem (VIS).
* **Data Processing**: Compiled by the USGS Astrogeology Research Program, merging over 4,600 high-resolution camera frames with rigorous geodetic control network adjustments and photometric normalization.
* **Ground Resolution**: $\approx 232\text{ meters per pixel}$ at the equator (1/256 degree per pixel).
* **Spectral Characteristics**: Calibrated three-color composite (red, green, violet/clear) representing the true visible albedo of the Martian dust and rock surfaces.
* **WMTS Tile URL Template**:
  ```
  https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg
  ```
* **Operational Role**: Primary optical reconnaissance, visual landmark confirmation, surface crater morphology, and regolith color discrimination.

#### 2. NASA MGS MOLA Global Topographic Color Shaded Relief
* **Dataset Identifier**: `Mars_MGS_MOLA_ClrShade_merge_global_463m`
* **Mission & Instrument**: Mars Global Surveyor (MGS) — Mars Orbiter Laser Altimeter (MOLA MEGDR).
* **Data Processing**: Developed by NASA Goddard Space Flight Center (GSFC) and USGS by interpolating over 600 million laser altimetry pulses tied to the Mars Areoid (Delta Geoid) gravity reference datum.
* **Ground Resolution**: $\approx 463\text{ meters per pixel}$ (128 pixels per degree).
* **Vertical Range**: $-8,200\text{ m}$ (depth of Hellas Impact Basin) to $+21,240\text{ m}$ (summit of Olympus Mons).
* **Cartographic Visualization**: Multi-stop elevation colormap blended with synthetic northwest hillshading ($315^\circ$ azimuth, $45^\circ$ altitude):
  * **Blue / Cyan**: Low-elevation impact basins and northern lowlands ($-8,200\text{ m}$ to $-3,000\text{ m}$).
  * **Green / Yellow**: Intermediate highland plains and crater floors ($-3,000\text{ m}$ to $+1,000\text{ m}$).
  * **Orange / Red / White**: High plateau volcanic provinces and summits ($+1,000\text{ m}$ to $+21,240\text{ m}$).
* **WMTS Tile URL Template**:
  ```
  https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg
  ```
* **Operational Role**: Topographic elevation assessment, immediate recognition of steep scarps, canyon wall drop-offs, and slope safety verification.

#### 3. 2001 Mars Odyssey THEMIS Daytime Infrared Global Mosaic
* **Dataset Identifier**: `THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018`
* **Mission & Instrument**: 2001 Mars Odyssey — Thermal Emission Imaging System (THEMIS).
* **Data Processing**: Produced by the Mars Space Flight Facility at Arizona State University (ASU) in collaboration with USGS (v2 release, October 2018). Orthorectified and controlled using MOLA elevations and Viking MDIM 2.1 geometry.
* **Ground Resolution**: $\approx 100\text{ meters per pixel}$ (highest-resolution global thermal map of Mars, serving up to zoom level 9).
* **Coverage Limits**: Geometrically constrained between $65.0^\circ\text{S}$ and $65.0^\circ\text{N}$ latitude (due to seasonal polar frost interference in polar regions).
* **Physical Measurement**: Daytime surface brightness temperature recorded at infrared wavelengths ($12.57\,\mu\text{m}$, Band 9).
* **Thermal Inertia Interpretation**:
  * **Dark / Low DN**: Fine unconsolidated dust deposits with low thermal inertia (cools down rapidly).
  * **Bright / High DN**: Exposed consolidated bedrock, duricrust, and dense rocky scree with high thermal inertia (retains solar heat).
* **WMTS Tile URL Template**:
  ```
  https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png
  ```
* **Operational Role**: Surface physical property diagnostics, regolith trafficability estimation, and sand dune vs. solid rock identification for rover wheels and astronaut spacesuit boots.

---

### Tile Caching & Offline Fallback Strategy
* **Local Thumbnails (`/public`)**: High-resolution preview thumbnails for each layer are stored locally (`optical_thumb.jpg`, `elevation_thumb.jpg`, `themis_thumb.png`) to ensure instant sidebar rendering even on slow or offline connections.
* **Up-Scaling on Deep Zooms**: The Leaflet map is configured with `maxNativeZoom` ($7$ for Optical/MOLA, $9$ for THEMIS) and `maxZoom: 12`. When zooming into localized exploration zones like Jezero Crater, Leaflet upscales native pixels cleanly without issuing out-of-range requests or throwing 404 tile errors.

---

## 3. Modular Industry-Grade Component Architecture

The codebase has been refactored from a monolithic file into modular components following modern React and GIS best practices:

```
src/
├── constants/
│   ├── api.js                   # Backend endpoint URL and NASA Trek WMTS root configuration
│   ├── layers.js                # Layer definitions (Optical, MOLA Elevation, THEMIS IR)
│   └── places.js                # Planetary landmark catalog (Valles Marineris, Jezero, etc.)
│
├── utils/
│   ├── geo.js                   # Coordinate formatting and antimeridian splitRoute logic
│   └── icons.js                 # Leaflet custom divIcons (landmarkIcon, routeIcon)
│
├── services/
│   └── api.js                   # Asynchronous route calculation service (FastAPI + Vite fallback)
│
├── components/
│   ├── TopBar/
│   │   └── TopBar.jsx           # Mission Mars brand mark, status indicator, and Path Planner toggle
│   │
│   ├── Sidebar/
│   │   ├── Sidebar.jsx          # Collapsible exploration sidebar container
│   │   ├── LayerList.jsx        # 3 selectable map layers with thumbnail previews
│   │   └── PlacesList.jsx       # Ranked exploration landmarks with click-to-fly navigation
│   │
│   ├── Map/
│   │   ├── MapView.jsx          # Map container coordinating tiles, markers, and HUD elements
│   │   ├── MapController.jsx    # Leaflet map event listener and camera animation handler
│   │   ├── MapControls.jsx      # Zoom In, Zoom Out, and Reset View controls
│   │   ├── SearchBar.jsx        # Autocomplete search with "/" keyboard shortcut
│   │   ├── InfoModal.jsx        # "About Martian Map" informational modal dialog
│   │   └── MapBottomBar.jsx     # Live cursor / center coordinates and NASA attribution
│   │
│   └── PathPlanner/
│       ├── PathPlanner.jsx      # Dedicated route planning container
│       ├── RoutePoints.jsx      # Point A (Origin) and Point B (Target) pickers
│       ├── TraverseProfile.jsx  # Safest, Fastest, and Science mode selector buttons
│       └── RouteResults.jsx     # Numerical telemetry stat cards (Distance, EVA Time, Slope, Gain)
│
├── App.jsx                      # Main application orchestrator & centralized state manager
├── main.jsx                     # Clean React 18/19 DOM root mount
└── style.css                    # Production styling
```

---

## 4. Key UI & Geodesy Capabilities

1. **Precision Point-and-Click Path Planning**:
   * Click **Start point (A)** or **Destination (B)** in the Path Planner panel.
   * Click anywhere on Mars to anchor coordinates formatted in planetary notation (e.g. `18.44° N / 77.45° E`).
   * Alternatively, click any landmark on the map (or search result) to set it as **Start (A)** or **Dest (B)** directly from the marker popup.

2. **Antimeridian Polyline Splitting**:
   * Standard cylindrical equirectangular projections ($180^\circ\text{W}$ to $180^\circ\text{E}$) typically distort routes that cross the antimeridian, causing straight lines across the whole world.
   * `src/utils/geo.js` (`splitRoute`) automatically computes intersection latitudes and splits routes across the $180^\circ$ meridian into continuous visual segments.

3. **Smooth Tile Scaling & Clamped Viewport**:
   * `maxNativeZoom` ($7$ or $9$) paired with `maxZoom: 12` ensures Leaflet upscales native tiles on high zoom without firing out-of-bounds 404 tile errors.
   * `minZoom: 2` and `maxBoundsViscosity: 1.0` keep the Martian globe framed in the viewport, preventing disorienting letterboxing into empty space.

4. **Streamlined 3-Mode Traverse Profiles**:
   * **Safest**: Strictly avoids steep slopes and ridges to conserve spacesuit life-support consumables and reduce joint strain.
   * **Fastest**: Prioritizes direct transit paths while respecting maximum mechanical vehicle limits.
   * **Science**: Traverses routes incentivized by proximity to USGS cataloged astrobiology and stratigraphy targets.

5. **Clean Telemetry Readout**:
   * Once computed by the FastAPI engine, routes display numerical mission metrics:
     * **Total Ground Track Distance** (meters or kilometers)
     * **Estimated EVA Walking Time** (minutes or hours)
     * **Maximum Slope Angle** ($^\circ$)
     * **Cumulative Elevation Gain** ($+\text{m}$)

---

## 5. Backend Integration Contract

The frontend connects to the **Martian Map FastAPI** pathfinding service:

### Route Request Payload (`POST /api/plan-route`)
```json
{
  "start": [18.4447, 77.4508],
  "end": [18.4585, 77.4240],
  "mode": "safest"
}
```

### Route Response Payload
```json
{
  "mode_used": "safest",
  "verdict": "SAFE",
  "reason": "[SAFEST] Safe corridor verified. Max incline 7.4° is within nominal EVA limits.",
  "total_distance_m": 5203.4,
  "elevation_gain_m": 128.6,
  "max_slope_deg": 7.4,
  "est_eva_minutes": 104.1,
  "waypoints": [
    { "lat": 18.4447, "lng": 77.4508, "elevation_m": -2564.5, "slope_deg": 0.0 },
    { "lat": 18.4466, "lng": 77.4490, "elevation_m": -2567.7, "slope_deg": 1.8 }
  ]
}
```

---

## 6. Quick Start & Local Setup

### Prerequisites
* **Node.js**: v18.x, v20.x, or v22.x+
* **npm**: v9.x or v10.x+
* *(Optional)* Running instance of the `martian-map-backend` at `http://localhost:8000`.

### 1. Installation
```bash
git clone https://github.com/nasa-space-apps-martian-map/martian-map-frontend.git
cd martian-map-frontend
npm install
```

### 2. Configure Environment
Create or edit `.env` in the project root:
```env
# URL of your running FastAPI service
VITE_FASTAPI_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
```

### 3. Launch the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates a static production bundle in `dist/` ready for hosting on Cloudflare Pages, Vercel, Netlify, or AWS S3.

---

## 7. Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`/`** | Focus the Martian landmark search bar |
| **`Enter`** | Fly directly to the first matching search result |
| **`Esc`** | Dismiss search results or close the Info modal |

---

## 8. Data Credits & Acknowledgments

* **NASA / JPL-Caltech / USGS Astrogeology Science Center**: Planetary Equirectangular WMTS tile mosaics.
* **Mars Global Surveyor (MGS) MOLA Science Team**: Global Martian altimetry and digital elevation models.
* **2001 Mars Odyssey THEMIS Team (Arizona State University)**: Controlled daytime infrared mosaics.
* **NASA Space Apps Challenge 2026**: Planetary logistics and autonomous surface mobility challenge.
