import React from 'react';

export function RouteResults({ route }) {
  if (!route) return null;

  return (
    <div className="route-result-box">
      <div className="route-stats-grid">
        <div className="stat-card">
          <span className="stat-label">DISTANCE</span>
          <strong className="stat-val">
            {route.total_distance_m >= 1000
              ? `${(route.total_distance_m / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
              : `${Math.round(route.total_distance_m)} m`}
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">EST. EVA TIME</span>
          <strong className="stat-val">
            {route.est_eva_minutes >= 60
              ? `${Math.floor(route.est_eva_minutes / 60)}h ${Math.round(route.est_eva_minutes % 60)}m`
              : `${Math.round(route.est_eva_minutes)} min`}
          </strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">MAX SLOPE</span>
          <strong className="stat-val">{route.max_slope_deg?.toFixed(1) || 0}°</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">ELEV GAIN</span>
          <strong className="stat-val">+{Math.round(route.elevation_gain_m || 0)} m</strong>
        </div>
      </div>

      {route.dem_source && (
        <p className="route-source-note">DEM Tier: {route.dem_source}</p>
      )}
    </div>
  );
}
