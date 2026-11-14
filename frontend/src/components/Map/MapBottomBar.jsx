import React from 'react';
import { Crosshair } from 'lucide-react';
import { coord } from '../../utils/geo';

export function MapBottomBar({ mouse, position, zoom }) {
  const currentPos = mouse || position;

  return (
    <>
      <div className="map-bottom">
        <div className="coordinates">
          <div className="coordinate-icon">
            <Crosshair size={16} />
          </div>
          <div>
            <small>{mouse ? 'CURSOR COORDINATES' : 'CENTER COORDINATES'}</small>
            <strong>
              {coord(currentPos.lat, 'N', 'S')} <span>/</span>{' '}
              {coord(currentPos.lng, 'E', 'W')}
            </strong>
          </div>
        </div>
      </div>

      <div className="map-credit">
        IMAGERY: NASA / JPL-CALTECH / USGS <span>·</span> ZOOM {String(zoom).padStart(2, '0')}
      </div>
    </>
  );
}
