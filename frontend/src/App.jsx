import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
import { layers } from './constants/layers';
import { calculateRoutePlan } from './services/api';
import { TopBar } from './components/TopBar/TopBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapView } from './components/Map/MapView';
import { PathPlanner } from './components/PathPlanner/PathPlanner';

export function App() {
  const [selectedLayer, setSelectedLayer] = useState(layers[0]);
  const [position, setPosition] = useState({ lat: -12, lng: -60 });
  const [mouse, setMouse] = useState(null);
  const [zoom, setZoom] = useState(2);
  const [target, setTarget] = useState(null);
  const [action, setAction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 600);
  const [plannerOpen, setPlannerOpen] = useState(false);

  // Route Planning State
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [mode, setMode] = useState('safest');
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [calculating, setCalculating] = useState(false);

  // Map Click Handler for Point Selection
  const handleMapClick = ({ lat, lng }) => {
    if (!selecting || calculating) return;
    if (lat < -90 || lat > 90) {
      setRouteError('Please select a point on the Martian surface (Lat -90° to 90°).');
      return;
    }
    const point = {
      lat: Number(lat.toFixed(4)),
      lng: Number((((((lng + 180) % 360) + 360) % 360) - 180).toFixed(4))
    };
    if (selecting === 'source') setSource(point);
    else setDestination(point);
    setSelecting(null);
    setRoute(null);
    setRouteError('');
  };

  // Route Calculation CTA
  const handleCalculatePath = async () => {
    if (!source || !destination) return;
    setCalculating(true);
    setRouteError('');
    setSelecting(null);

    try {
      const data = await calculateRoutePlan({ source, destination, mode });
      setRoute(data);
    } catch (e) {
      console.error('Route calculation failure:', e);
      setRouteError(e.message || 'Unable to reach the Martian FastAPI pathfinding service.');
      setRoute(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleClearRoute = () => {
    setSource(null);
    setDestination(null);
    setRoute(null);
    setSelecting(null);
    setRouteError('');
  };

  const handleSetPresetPoint = (type, point) => {
    if (type === 'source') setSource(point);
    else setDestination(point);
    setRoute(null);
    setRouteError('');
    setPlannerOpen(true);
  };

  const handleSelectPlace = (p) => {
    setTarget({ ...p, stamp: Date.now() });
  };

  const handleCommand = (type) => {
    setAction({ type, stamp: Date.now() });
  };

  const handleToggleSelecting = (key) => {
    setSelecting((curr) => (curr === key ? null : key));
    setRouteError('');
    if (window.innerWidth <= 600) setSidebarOpen(false);
  };

  const handleTogglePlanner = () => {
    setPlannerOpen(!plannerOpen);
    if (!plannerOpen && window.innerWidth <= 600) setSidebarOpen(false);
  };

  return (
    <div className="app">
      <TopBar
        plannerOpen={plannerOpen}
        onTogglePlanner={handleTogglePlanner}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="workspace">
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close drawer backdrop"
          />
        )}

        <Sidebar
          isOpen={sidebarOpen}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onSelectPlace={handleSelectPlace}
          onClose={() => setSidebarOpen(false)}
        />

        <MapView
          selectedLayer={selectedLayer}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          target={target}
          position={position}
          setPosition={setPosition}
          zoom={zoom}
          setZoom={setZoom}
          mouse={mouse}
          setMouse={setMouse}
          action={action}
          onCommand={handleCommand}
          onSelectPlace={handleSelectPlace}
          onMapClick={handleMapClick}
          source={source}
          destination={destination}
          route={route}
          selecting={selecting}
          onCancelSelecting={() => setSelecting(null)}
          onSetPresetPoint={handleSetPresetPoint}
        />

        {!plannerOpen && (
          <button
            type="button"
            className="planner-unhide-btn"
            onClick={() => setPlannerOpen(true)}
            title="Open route planner"
            aria-label="Open route planner"
          >
            <Navigation size={14} />
          </button>
        )}

        {plannerOpen && (
          <PathPlanner
            source={source}
            destination={destination}
            selecting={selecting}
            onToggleSelecting={handleToggleSelecting}
            mode={mode}
            onSelectMode={setMode}
            onCalculate={handleCalculatePath}
            onClear={handleClearRoute}
            calculating={calculating}
            route={route}
            routeError={routeError}
            onClose={() => setPlannerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
