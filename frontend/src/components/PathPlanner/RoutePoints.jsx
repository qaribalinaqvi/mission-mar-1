import React from 'react';
import { Crosshair } from 'lucide-react';
import { coord } from '../../utils/geo';

export function RoutePoints({
  source,
  destination,
  selecting,
  onToggleSelecting,
  disabled
}) {
  const points = [
    { key: 'source', letter: 'A', label: 'Start point', point: source, dotColor: '#10b981' },
    { key: 'destination', letter: 'B', label: 'Destination', point: destination, dotColor: '#f43f5e' }
  ];

  return (
    <div className="route-points">
      {points.map(({ key, letter, label, point, dotColor }) => (
        <button
          key={key}
          disabled={disabled}
          onClick={() => onToggleSelecting(key)}
          className={'route-select ' + (selecting === key ? 'selecting' : '')}
        >
          <span className="route-letter" style={{ background: dotColor }}>{letter}</span>
          <span className="route-point-text">
            <strong>{label}</strong>
            <small>
              {selecting === key
                ? 'Click anywhere on the map'
                : point
                ? `${coord(point.lat, 'N', 'S')}  /  ${coord(point.lng, 'E', 'W')}`
                : 'Select on map'}
            </small>
          </span>
          <Crosshair size={15} />
        </button>
      ))}
    </div>
  );
}
