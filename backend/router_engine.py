from __future__ import annotations

import heapq
import math
from typing import Literal
from models import RouteRequest, RouteResponse, Waypoint
from terrain import TerrainGrid, load_route_window

# Standard 8-connected grid offsets for orthogonal and diagonal traverses
NEIGHBOR_OFFSETS: list[tuple[int, int]] = [
    (-1, 0), (1, 0), (0, -1), (0, 1),
    (-1, -1), (-1, 1), (1, -1), (1, 1),
]

# Major Martian planetary and science exploration landmarks
SCIENCE_LANDMARKS: list[tuple[float, float]] = [
    (18.44, 77.45),    # Jezero Crater (Perseverance / Octavia Butler Base)
    (-5.4, 137.8),     # Gale Crater (Curiosity Rover / Mount Sharp)
    (18.65, -133.8),   # Olympus Mons Caldera & Flank
    (-13.9, -59.2),    # Valles Marineris (Coprates Chasma)
    (4.5, 135.6),      # Elysium Planitia (InSight Seismic Station)
    (-42.4, 70.5),     # Hellas Impact Basin
]

# Standard suited astronaut walking pace (~3.0 km/h = 50.0 m/min)
EVA_WALKING_PACE_M_PER_MIN: float = 50.0


def _run_astar(
    start_rc: tuple[int, int],
    end_rc: tuple[int, int],
    grid: TerrainGrid,
    mode: str,
    max_allowed_slope: float,
) -> list[tuple[int, int]] | None:
    """Execute terrain-weighted A* on the windowed elevation grid."""
    open_heap: list[tuple[float, tuple[int, int]]] = [(0.0, start_rc)]
    g_score: dict[tuple[int, int], float] = {start_rc: 0.0}
    came_from: dict[tuple[int, int], tuple[int, int]] = {}
    visited: set[tuple[int, int]] = set()

    end_r, end_c = end_rc
    h_scale = 0.40 if mode == "science" else 1.0

    while open_heap:
        _, current = heapq.heappop(open_heap)

        if current in visited:
            continue
        visited.add(current)

        if current == end_rc:
            path: list[tuple[int, int]] = []
            curr = current
            while curr in came_from:
                path.append(curr)
                curr = came_from[curr]
            path.append(start_rc)
            path.reverse()
            return path

        r1, c1 = current
        curr_g = g_score[current]

        for dr, dc in NEIGHBOR_OFFSETS:
            r2 = r1 + dr
            c2 = c1 + dc

            if not (0 <= r2 < grid.rows and 0 <= c2 < grid.cols):
                continue

            neighbor = (r2, c2)
            if neighbor in visited:
                continue

            dist_m = math.hypot(dr * grid.cell_height_m, dc * grid.cell_width_m)
            dz = float(grid.elevation[r2, c2]) - float(grid.elevation[r1, c1])
            slope_deg = math.degrees(math.atan2(abs(dz), dist_m))

            # Strict hard obstacle blocking
            if slope_deg > max_allowed_slope:
                continue

            # Incline cost calculations
            if mode == "fastest":
                step_cost = dist_m + abs(dz) * 0.5
            elif mode == "safest":
                step_cost = (
                    dist_m * (1.0 + (slope_deg / 2.0) ** 3 * 4.0)
                    + max(0.0, dz) * 18.0
                    + abs(dz) * 8.0
                )
            else:  # science
                lat_n, lng_n = grid.rc_to_latlng(r2, c2)
                min_deg_to_landmark = min(
                    math.hypot(lat_n - lm[0], lng_n - lm[1]) for lm in SCIENCE_LANDMARKS
                )
                sci_discount = 0.40 if min_deg_to_landmark <= 1.5 else 1.0
                step_cost = (
                    dist_m * (1.0 + (slope_deg / 3.5) ** 2 * 3.0)
                    + abs(dz) * 6.0
                ) * sci_discount

            tentative_g = curr_g + step_cost

            if tentative_g < g_score.get(neighbor, float("inf")):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                h_dist = math.hypot((end_r - r2) * grid.cell_height_m, (end_c - c2) * grid.cell_width_m)
                heapq.heappush(open_heap, (tentative_g + h_dist * h_scale, neighbor))

    return None


def build_route_response(req: RouteRequest) -> RouteResponse:
    """Extract MOLA elevation window, solve raw cell-by-cell A*, and assemble RouteResponse."""
    dem_source: Literal["NASA MGS MOLA Global DEM (463m/px)"] = "NASA MGS MOLA Global DEM (463m/px)"

    # Edge Case 1: Identical start and end coordinates
    if req.start == req.end:
        grid = load_route_window(req.start, req.end)
        start_rc = grid.latlng_to_rc(req.start[0], req.start[1])
        elev_m = round(float(grid.elevation[start_rc]), 1)
        return RouteResponse(
            mode_used=req.mode,
            verdict="SAFE",
            reason=f"[{req.mode.upper()}] Origin and destination are identical. Zero traverse required.",
            total_distance_m=0.0,
            elevation_gain_m=0.0,
            max_slope_deg=0.0,
            est_eva_minutes=0.0,
            dem_source=dem_source,
            waypoints=[
                Waypoint(
                    lat=round(req.start[0], 6),
                    lng=round(req.start[1], 6),
                    elevation_m=elev_m,
                    slope_deg=0.0,
                )
            ],
        )

    grid = load_route_window(req.start, req.end)
    start_rc = grid.latlng_to_rc(req.start[0], req.start[1])
    end_rc = grid.latlng_to_rc(req.end[0], req.end[1])

    # Edge Case 2: Start and end fall inside the exact same grid cell
    if start_rc == end_rc:
        elev_start = round(float(grid.elevation[start_rc]), 1)
        return RouteResponse(
            mode_used=req.mode,
            verdict="SAFE",
            reason=f"[{req.mode.upper()}] Origin and destination lie inside the same DEM cell (<{grid.cell_height_m:.0f}m).",
            total_distance_m=0.0,
            elevation_gain_m=0.0,
            max_slope_deg=0.0,
            est_eva_minutes=0.0,
            dem_source=dem_source,
            waypoints=[
                Waypoint(lat=round(req.start[0], 6), lng=round(req.start[1], 6), elevation_m=elev_start, slope_deg=0.0),
                Waypoint(lat=round(req.end[0], 6), lng=round(req.end[1], 6), elevation_m=elev_start, slope_deg=0.0),
            ],
        )

    raw_path: list[tuple[int, int]] | None = None
    effective_max_slope: float = 8.0
    relaxed: bool = False

    if req.mode == "fastest":
        effective_max_slope = 22.0
        raw_path = _run_astar(start_rc, end_rc, grid, "fastest", effective_max_slope)
    elif req.mode == "science":
        effective_max_slope = 12.0
        raw_path = _run_astar(start_rc, end_rc, grid, "science", effective_max_slope)
    else:  # safest
        effective_max_slope = 8.0
        raw_path = _run_astar(start_rc, end_rc, grid, "safest", 8.0)
        if raw_path is None:
            effective_max_slope = 14.0
            raw_path = _run_astar(start_rc, end_rc, grid, "safest", 14.0)
            relaxed = True

    if raw_path is None:
        start_elev = round(float(grid.elevation[start_rc]), 1)
        end_elev = round(float(grid.elevation[end_rc]), 1)
        return RouteResponse(
            mode_used=req.mode,
            verdict="NO-GO",
            reason=f"Terrain blocked by cliffs/slopes exceeding {effective_max_slope:.0f}° ceiling.",
            total_distance_m=0.0,
            elevation_gain_m=0.0,
            max_slope_deg=round(effective_max_slope + 5.0, 1),
            est_eva_minutes=0.0,
            dem_source=dem_source,
            waypoints=[
                Waypoint(lat=round(req.start[0], 6), lng=round(req.start[1], 6), elevation_m=start_elev, slope_deg=0.0),
                Waypoint(lat=round(req.end[0], 6), lng=round(req.end[1], 6), elevation_m=end_elev, slope_deg=round(effective_max_slope + 5.0, 1)),
            ],
        )

    # Return raw, unsmoothed cell-by-cell path directly from elevation grid
    waypoints: list[Waypoint] = []
    total_dist = 0.0
    elev_gain = 0.0
    max_slope = 0.0

    for i, (r, c) in enumerate(raw_path):
        lat, lng = grid.rc_to_latlng(r, c)
        elev = round(float(grid.elevation[r, c]), 1)
        step_slope = 0.0

        if i > 0:
            pr, pc = raw_path[i - 1]
            step_d = math.hypot((r - pr) * grid.cell_height_m, (c - pc) * grid.cell_width_m)
            elev_diff = float(grid.elevation[r, c]) - float(grid.elevation[pr, pc])
            step_slope = math.degrees(math.atan2(abs(elev_diff), max(1.0, step_d)))
            total_dist += step_d
            if elev_diff > 0:
                elev_gain += elev_diff
            max_slope = max(max_slope, step_slope)

        # Pin precise extremities
        if i == 0:
            lat, lng = round(req.start[0], 6), round(req.start[1], 6)
        elif i == len(raw_path) - 1:
            lat, lng = round(req.end[0], 6), round(req.end[1], 6)

        waypoints.append(
            Waypoint(
                lat=lat,
                lng=lng,
                elevation_m=elev,
                slope_deg=round(step_slope, 1),
            )
        )

    # Standard safety verdicts:
    # SAFE: max slope <= 6.0°
    # CAUTION: 6.0° < max slope <= 15.0°
    # NO-GO: max slope > 15.0°
    if max_slope <= 6.0:
        verdict: Literal["SAFE", "CAUTION", "NO-GO"] = "SAFE"
        reason = f"[{req.mode.upper()}] Safe corridor verified. Max incline {max_slope:.1f}° is within nominal limits."
    elif max_slope <= 15.0:
        verdict = "CAUTION"
        extra = " (auto-relaxed to 14° pass)" if relaxed else ""
        reason = f"[{req.mode.upper()}] Moderate incline alert ({max_slope:.1f}° max{extra}). Adjust velocity and monitor surface stability."
    else:
        verdict = "NO-GO"
        reason = f"[{req.mode.upper()}] Hazardous terrain alert. Max incline {max_slope:.1f}° exceeds safe limits."

    return RouteResponse(
        mode_used=req.mode,
        verdict=verdict,
        reason=reason,
        total_distance_m=round(total_dist, 1),
        elevation_gain_m=round(elev_gain, 1),
        max_slope_deg=round(max_slope, 1),
        est_eva_minutes=round(total_dist / EVA_WALKING_PACE_M_PER_MIN, 1),
        dem_source=dem_source,
        waypoints=waypoints,
    )
