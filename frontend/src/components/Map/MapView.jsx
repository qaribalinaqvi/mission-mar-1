import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { PanelLeftClose, PanelLeftOpen, Crosshair } from 'lucide-react';
import { places } from '../../constants/places';
import { layers } from '../../constants/layers';
import { NASA_TREK_ROOT } from '../../constants/api';
import { coord, splitRoute, getVerdictStyle } from '../../utils/geo';
import { landmarkIcon, routeIcon } from '../../utils/icons';
import { MapController } from './MapController';
import { SearchBar } from './SearchBar';
import { MapControls } from './MapControls';
import { MapBottomBar } from './MapBottomBar';

export function MapView({
  selectedLayer,
  sidebarOpen,
  onToggleSidebar,
  target,
  position,
  setPosition,
  zoom,
  setZoom,
  mouse,
  setMouse,
  action,
  onCommand,
  onSelectPlace,
  onMapClick,
  source,
  destination,
  route,
  selecting,
  onCancelSelecting,
  onSetPresetPoint
}) {
  const waypoints = route ? route.waypoints || route.coordinates || [] : [];
  const verdictMeta = route ? getVerdictStyle(route.verdict) : null;

  // Eagerly pre-cache initial zoom 2 tiles into browser memory
  useEffect(() => {
    const initialTiles = [
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/1.jpg`,
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/2.jpg`,
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/3.jpg`,
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/2/1.jpg`,
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/2/2.jpg`,
      `${NASA_TREK_ROOT}Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/2/3.jpg`
    ];
    initialTiles.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <main className={'map-area ' + (selecting ? 'selecting-map' : '')}>
      <MapContainer
        center={[-12, -60]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        crs={L.CRS.EPSG4326}
        zoomControl={false}
        attributionControl={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        className="map"
      >
        {/* Active Isolated Layer with smooth responsive tile rendering */}
        <TileLayer
          key={selectedLayer.id}
          url={selectedLayer.url}
          opacity={1}
          noWrap={true}
          maxNativeZoom={selectedLayer.maxNativeZoom || 7}
          maxZoom={14}
          bounds={selectedLayer.bounds || [[-90, -180], [90, 180]]}
          keepBuffer={8}
          updateInterval={30}
          updateWhenZooming={true}
          updateWhenIdle={false}
        />

        {/* Landmark Exploration Markers */}
        {places.map((p) => (
          <Marker
            key={p.name}
            position={[p.lat, p.lng]}
            icon={landmarkIcon(p.name)}
            title={p.name}
          >
            <Popup>
              <div className="landmark-popup">
                <span>{p.type}</span>
                <strong>{p.name}</strong>
                <p>{p.description}</p>
                <small>
                  {coord(p.lat, 'N', 'S')} / {coord(p.lng, 'E', 'W')}
                </small>
                <div className="popup-route-actions">
                  <button onClick={() => onSetPresetPoint('source', { lat: p.lat, lng: p.lng })}>
                    Set as Start (A)
                  </button>
                  <button onClick={() => onSetPresetPoint('destination', { lat: p.lat, lng: p.lng })}>
                    Set as Dest (B)
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Source and Destination Markers */}
        {source && (
          <Marker
            position={[source.lat, source.lng]}
            icon={routeIcon('A', '#10b981')}
            title="Source"
          />
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={routeIcon('B', '#f43f5e')}
            title="Destination"
          />
        )}

        {/* Route Polyline (split across antimeridian) */}
        {waypoints.length > 0 &&
          splitRoute(waypoints).map((segment, i) => (
            <Polyline
              key={i}
              positions={segment}
              pathOptions={{
                color: verdictMeta?.color || '#ffb77e',
                weight: 4,
                opacity: 0.95,
                dashArray: route?.verdict === 'NO-GO' ? '6, 6' : undefined
              }}
            />
          ))}

        <MapController
          target={target}
          setPosition={setPosition}
          setZoom={setZoom}
          setMouse={setMouse}
          action={action}
          onMapClick={onMapClick}
          routePoints={waypoints}
          sidebarOpen={sidebarOpen}
          selectedLayer={selectedLayer}
        />
      </MapContainer>

      {/* Floating Top Controls: Sidebar Toggle, Search Bar, Projection Pill */}
      <div className="map-top">
        <button
          type="button"
          className="icon-btn sidebar-toggle"
          title={sidebarOpen ? 'Hide drawer' : 'Show drawer'}
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Hide drawer' : 'Show drawer'}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <SearchBar onSelectPlace={onSelectPlace} />
      </div>

      {/* Selecting Target Prompt Notice */}
      {selecting && (
        <div className="map-select-notice">
          <Crosshair size={15} />
          <span>
            Click the map to set your{' '}
            {selecting === 'source' ? 'start point' : 'destination'}
          </span>
          <button onClick={onCancelSelecting}>Cancel</button>
        </div>
      )}


      {/* Map Zoom & Reset Controls */}
      <MapControls onCommand={onCommand} />

      {/* Coordinates & Credit Bar */}
      <MapBottomBar mouse={mouse} position={position} zoom={zoom} />
    </main>
  );
}
