import React from 'react';
import { ShieldCheck, Zap, Compass } from 'lucide-react';

export function TraverseProfile({ mode, onSelectMode, disabled }) {
  return (
    <div className="route-mode-section">
      <div className="route-mode-header">
        <span className="route-label-tiny">TRAVERSE PROFILE</span>
      </div>

      <div className="route-mode-buttons">
        <button
          type="button"
          className={'mode-pill ' + (mode === 'safest' ? 'active' : '')}
          onClick={() => onSelectMode('safest')}
          disabled={disabled}
          title="Safest: Minimizes slopes and joint strain"
        >
          <ShieldCheck size={13} />
          <span>Safest</span>
        </button>
        <button
          type="button"
          className={'mode-pill ' + (mode === 'fastest' ? 'active' : '')}
          onClick={() => onSelectMode('fastest')}
          disabled={disabled}
          title="Fastest: Direct dash, accepts steeper slopes"
        >
          <Zap size={13} />
          <span>Fastest</span>
        </button>
        <button
          type="button"
          className={'mode-pill ' + (mode === 'science' ? 'active' : '')}
          onClick={() => onSelectMode('science')}
          disabled={disabled}
          title="Science: Routes near USGS astrobiology targets"
        >
          <Compass size={13} />
          <span>Science</span>
        </button>
      </div>
    </div>
  );
}
