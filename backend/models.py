from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class RouteRequest(BaseModel):
    """Payload for calculating an optimal Martian surface traverse between two coordinates.
    
    Coordinates can be anywhere across the entire Martian globe (-90°..90° Lat, -180°..180° Lon),
    from local exploration inside Jezero/Gale Crater to multi-thousand kilometer continental expeditions.
    """

    start: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Starting coordinates [latitude, longitude] in decimal degrees.",
        json_schema_extra={"example": [18.4447, 77.4508]},
    )
    end: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Destination coordinates [latitude, longitude] in decimal degrees.",
        json_schema_extra={"example": [18.4810, 77.3850]},
    )
    mode: Literal["safest", "fastest", "science"] = Field(
        default="safest",
        description="Traverse optimization profile: 'safest', 'fastest', or 'science'.",
        json_schema_extra={"example": "safest"},
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "start": [18.4447, 77.4508],
                    "end": [18.4810, 77.3850],
                    "mode": "safest",
                },
                {
                    "start": [-12.5, -61.0],
                    "end": [-15.2, -58.5],
                    "mode": "science",
                },
            ]
        }
    )


class Waypoint(BaseModel):
    """Discrete GPS and elevation node along a planned Martian surface path."""

    lat: float = Field(..., description="Martian latitude in decimal degrees.")
    lng: float = Field(..., description="Martian longitude in decimal degrees.")
    elevation_m: float = Field(..., description="Topographic elevation relative to the Mars MOLA datum (meters).")
    slope_deg: float = Field(..., description="Local terrain slope in degrees at this waypoint.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "lat": 18.4447,
                "lng": 77.4508,
                "elevation_m": -2564.0,
                "slope_deg": 1.4,
            }
        }
    )


class RouteResponse(BaseModel):
    """Complete navigation solution, traverse energetics, and safety assessment."""

    mode_used: Literal["safest", "fastest", "science"] = Field(
        ..., description="Routing profile used to compute this trajectory."
    )
    verdict: Literal["SAFE", "CAUTION", "NO-GO"] = Field(
        ..., description="Safety assessment: SAFE (<=6°), CAUTION (6°..15°), or NO-GO (>15° or blocked)."
    )
    reason: str = Field(..., description="Operational rationale explaining the safety verdict and profile behavior.")
    total_distance_m: float = Field(..., description="Total ground track distance in meters.")
    elevation_gain_m: float = Field(..., description="Cumulative uphill elevation climb in meters.")
    max_slope_deg: float = Field(..., description="Steepest single-step incline encountered along the route (degrees).")
    est_eva_minutes: float = Field(
        ..., description="Estimated traverse time in minutes (based on suited astronaut/pressurized rover pace)."
    )
    dem_source: Literal["NASA MGS MOLA Global DEM (463m/px)"] = Field(
        default="NASA MGS MOLA Global DEM (463m/px)",
        description="Unified planetary elevation dataset utilized for pathfinding.",
    )
    waypoints: list[Waypoint] = Field(..., description="Sequential list of navigational waypoints from start to destination.")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "mode_used": "safest",
                    "verdict": "SAFE",
                    "reason": "[SAFEST] Safe corridor verified (NASA MGS MOLA Global DEM (463m/px)). Max incline 3.2° is within nominal limits.",
                    "total_distance_m": 14320.5,
                    "elevation_gain_m": 45.0,
                    "max_slope_deg": 3.2,
                    "est_eva_minutes": 286.4,
                    "dem_source": "NASA MGS MOLA Global DEM (463m/px)",
                    "waypoints": [
                        {
                            "lat": 18.4447,
                            "lng": 77.4508,
                            "elevation_m": -2564.0,
                            "slope_deg": 0.0,
                        },
                        {
                            "lat": 18.4810,
                            "lng": 77.3850,
                            "elevation_m": -2480.0,
                            "slope_deg": 1.2,
                        },
                    ],
                }
            ]
        }
    )
