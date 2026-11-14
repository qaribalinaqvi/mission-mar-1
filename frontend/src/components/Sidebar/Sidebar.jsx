import React from 'react';
import { ExternalLink, PanelLeftClose } from 'lucide-react';
import { LayerList } from './LayerList';
import { PlacesList } from './PlacesList';

export function Sidebar({
  isOpen,
  selectedLayer,
  onSelectLayer,
  onSelectPlace,
  onClose
}) {
  return (
    <aside className={'sidebar ' + (!isOpen ? 'collapsed' : '')}>
      <div className="sidebar-sticky-header">
        <div className="eyebrow"><span className="orange-dot" /> THE RED PLANET</div>
        {onClose && (
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Hide drawer"
            aria-label="Hide left drawer"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      <div className="side-inner">
        <div className="side-heading">
          <div>
            <h1>Explore Mars<span>.</span></h1>
            <p>Discover the surface of our<br />neighboring world.</p>
          </div>
          <div className="planet-icon"><div /></div>
        </div>

        <div className="section-divider" />
        <LayerList
          selectedLayer={selectedLayer}
          onSelectLayer={onSelectLayer}
        />

        <div className="section-divider" />
        <PlacesList onSelectPlace={onSelectPlace} />

        <div className="sidebar-footer">
          <div className="status"><span className="live-dot" /> SATELLITE TELEMETRY ONLINE</div>
          <a
            href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars"
            target="_blank"
            rel="noreferrer"
          >
            About data <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </aside>
  );
}
