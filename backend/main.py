from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import RouteRequest, RouteResponse
from router_engine import build_route_response
from terrain import MOLA_META, MOLA_NPY_PATH, is_valid_mars_coord

app = FastAPI(
    title="Martian Map: Interplanetary EVA & Planetary Route API",
    description=(
        "Lean, high-performance pathfinding engine for Mars. Computes raw obstacle-avoiding traverses "
        "across the entire planet using our native 463 m/pixel NASA MGS MOLA Global DEM memory-map "
        "across Safest, Fastest, and Science operational profiles."
    ),
    version="4.0.0",
    contact={
        "name": "NASA Space Apps 2026 Hackathon Team: Mission Mar 1.0",
        "url": "https://github.com/ahmadnawaz01/Mission-Mar-1.0-Nasa-Space-Apps-Hackthon-2026",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/",
    tags=["Health & Telemetry"],
    summary="MOLA elevation array health check",
)
def health_check() -> dict:
    """Verify that the memory-mapped MOLA DEM is online and return raster telemetry."""
    return {
        "status": "online",
        "dem_file": MOLA_NPY_PATH.name,
        "shape": MOLA_META.get("shape", [23040, 46080]),
        "resolution_m": MOLA_META.get("native_resolution_m", 463.0),
        "planetary_bounds": {
            "lat": [MOLA_META.get("lat_min", -90.0), MOLA_META.get("lat_max", 90.0)],
            "lon": [MOLA_META.get("lon_min", -180.0), MOLA_META.get("lon_max", 180.0)],
        },
    }


@app.post(
    "/api/plan-route",
    response_model=RouteResponse,
    status_code=status.HTTP_200_OK,
    tags=["Navigation"],
    summary="Compute raw obstacle-avoiding surface traverse across Mars",
)
def plan_route(req: RouteRequest) -> RouteResponse:
    """Calculate a raw, cell-by-cell surface traverse across Mars.
    
    Traverse Profiles:
    - **safest**: Incline capped at <= 8.0° (auto-relaxes to 14.0° if blocked). Follows flat terrain passes.
    - **science**: Incline capped at <= 12.0°. Applies 60% corridor bonus near major Martian geologic landmarks.
    - **fastest**: Incline capped at <= 22.0°. Prioritizes shortest route while blocking cliffs.
    """
    start_lat, start_lng = req.start
    end_lat, end_lng = req.end

    if not is_valid_mars_coord(start_lat, start_lng) or not is_valid_mars_coord(end_lat, end_lng):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Coordinates must lie within valid Martian planetary bounds "
                "(Latitude [-90.0, 90.0], Longitude [-180.0, 180.0])."
            ),
        )

    try:
        return build_route_response(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route planning failed: {exc}",
        )
