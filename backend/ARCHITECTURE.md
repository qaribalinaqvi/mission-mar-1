# Martian Map: System Architecture & Technical Specification

> **NASA Space Apps Challenge 2026** — Planetary-Scale Surface Traversal Engine for Mars.  
> Powered by the full-resolution **NASA MGS MOLA Global DEM (463 m/pixel)** via memory-mapped NumPy arrays.

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    Client["Client / Mission Control HUD"]
    
    subgraph API_Layer ["FastAPI Service (main.py)"]
        Cors["CORS Middleware"]
        HealthRoute["GET / (Health & MOLA Telemetry)"]
        PlanRoute["POST /api/plan-route (A* Route Engine)"]
        Validator["Pydantic v2 Models (models.py)"]
        
        Cors --> HealthRoute
        Cors --> PlanRoute
        PlanRoute --> Validator
    end
    
    subgraph Terrain_Subsystem ["Terrain & Memory-Mapping (terrain.py)"]
        MMap["MOLA_MMAP: np.load('mars_mola_dem.npy', mmap_mode='r')<br/>(23040 x 46080 int16, ~0 MB Resident RAM)"]
        Slicer["load_route_window(start, end)<br/>Padded Geographic Slicing & Adaptive Striding"]
        Grid["TerrainGrid: float32 elevation slice, cell_h_m, cell_w_m"]
        
        Validator --> Slicer
        Slicer --> MMap
        MMap --> Grid
    end
    
    subgraph Routing_Engine ["Obstacle-Avoiding A* Engine (router_engine.py)"]
        AStar["Cell-by-Cell A* Search with Metric Slope Geometry"]
        Profiles{"Profile Cost Formulations"}
        
        Grid --> AStar
        AStar --> Profiles
        Profiles -->|"safest"| CostSafe["8° Max Slope Ceiling (Relax 14°)<br/>Exponential Slope & Climb Penalties"]
        Profiles -->|"science"| CostSci["12° Max Slope Ceiling<br/>60% Corridor Bonus near Landmarks"]
        Profiles -->|"fastest"| CostFast["22° Max Slope Ceiling<br/>Shortest Distance (Blocks Cliffs)"]
    end
    
    subgraph Output_Layer ["Telemetry & Response Construction"]
        Waypoints["Raw Cell-by-Cell Waypoints (No Artificial Smoothing)"]
        Verdict["Safety Verdict: SAFE (<=6°), CAUTION (6°..15°), NO-GO (>15°)"]
        Response["RouteResponse (JSON)"]
        
        CostSafe --> Waypoints
        CostSci --> Waypoints
        CostFast --> Waypoints
        Waypoints --> Verdict --> Response
        Response --> Client
    end
```

---

## 2. Key Technical Decisions & Invariants

1. **Zero-GDAL Runtime**:
   The 2 GB GeoTIFF is converted ahead-of-time via `convert_mola.py` into a raw binary `data/mars_mola_dem.npy` ($23,040 \times 46,080$ int16 array). Slicing via `mmap_mode="r"` executes in microseconds and consumes $\approx 0\text{ MB}$ of resident RAM.
2. **Raw A\* Fidelity**:
   Artificial smoothing / string-pulling is intentionally excluded. The API returns every discrete grid step directly from the elevation array, guaranteeing that every ridge detour and slope calculation is preserved verbatim.
3. **Adaptive Striding**:
   Local crater traverses ($\le 300 \times 300$) remain at 100% native 463 m/pixel resolution. Multi-thousand kilometer continental expeditions are strided to $\le 300 \times 300$, keeping response times under 40 milliseconds.

---

*Authored for the NASA Space Apps Challenge 2026.*
