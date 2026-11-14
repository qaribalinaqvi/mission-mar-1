import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

export function MapControls({ onCommand }) {
  return (
    <div className="map-controls">
      <button onClick={() => onCommand('in')} aria-label="Zoom in">
        <Plus size={19} />
      </button>
      <button onClick={() => onCommand('out')} aria-label="Zoom out">
        <Minus size={19} />
      </button>
      <div className="control-separator" />
      <button
        onClick={() => onCommand('reset')}
        title="Reset view"
        aria-label="Reset view"
      >
        <RotateCcw size={17} />
      </button>
    </div>
  );
}
