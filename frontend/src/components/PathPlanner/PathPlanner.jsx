import React from 'react';
import { ArrowUpRight, PanelRightClose } from 'lucide-react';
import { RoutePoints } from './RoutePoints';
import { TraverseProfile } from './TraverseProfile';
import { RouteResults } from './RouteResults';

export function PathPlanner({
  source,
  destination,
  selecting,
  onToggleSelecting,
  mode,
  onSelectMode,
  onCalculate,
  onClear,
  calculating,
  route,
  routeError,
  onClose
}) {
  const isCalculateDisabled = !source || !destination || calculating;
  const isClearDisabled = calculating || (!source && !destination && !route && !selecting);

  return (
    <section id="path-planner" className="route-panel" aria-label="Path planner">
      <div className="route-heading">
        <div>
          <span className="route-kicker">INTERPLANETARY EVA & TRAVERSE</span>
          <h3>Path Planner</h3>
        </div>
        <div className="route-heading-actions">
          <button
            type="button"
            className="route-clear"
            onClick={onClear}
            disabled={isClearDisabled}
            title="Clear path"
          >
            Clear
          </button>
          {onClose && (
            <button
              type="button"
              className="route-minimize-btn"
              onClick={onClose}
              title="Hide path planner"
              aria-label="Hide path planner"
            >
              <PanelRightClose size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="route-intro">Select start and destination on the map.</p>

      {/* Source & Destination Buttons */}
      <RoutePoints
        source={source}
        destination={destination}
        selecting={selecting}
        onToggleSelecting={onToggleSelecting}
        disabled={calculating}
      />

      {/* Traverse Profile (Safest, Fastest, Science) */}
      <TraverseProfile
        mode={mode}
        onSelectMode={onSelectMode}
        disabled={calculating}
      />

      {/* Calculate CTA */}
      <button
        type="button"
        className="calculate-btn"
        onClick={onCalculate}
        disabled={isCalculateDisabled}
      >
        {calculating ? 'Computing Traversal…' : 'Calculate Route'}{' '}
        <ArrowUpRight size={15} />
      </button>

      {/* Error Output */}
      {routeError && (
        <p className="route-error" role="alert">
          {routeError}
        </p>
      )}

      {/* Calculated Route Telemetry */}
      <RouteResults route={route} />

      <p className="route-note">Bio-energetic A* terrain-aware pathfinding · FastAPI</p>
    </section>
  );
}
