import React from 'react';
import { Layers3 } from 'lucide-react';
import { layers } from '../../constants/layers';

export function LayerList({ selectedLayer, onSelectLayer }) {
  return (
    <>
      <div className="section-title">
        <span><Layers3 size={15} /> MAP LAYERS</span>
        <span className="count">03</span>
      </div>
      <div className="section-description">Choose a view of the Martian surface.</div>
      <div className="layer-list">
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelectLayer(l)}
            className={'layer-card ' + (selectedLayer.id === l.id ? 'active' : '')}
          >
            <div className={'layer-thumb ' + l.id}>
              {l.thumb ? (
                <img
                  src={l.thumb}
                  alt={l.name}
                  onError={(e) => {
                    if (l.fallbackThumb && e.currentTarget.src !== l.fallbackThumb) {
                      e.currentTarget.src = l.fallbackThumb;
                    }
                  }}
                />
              ) : (
                <span>IR</span>
              )}
            </div>
            <div className="layer-text">
              <strong>{l.name}</strong>
              <small>{l.subtitle}</small>
              <em>{l.resolution}</em>
            </div>
            <span className="radio">{selectedLayer.id === l.id && <span />}</span>
          </button>
        ))}
      </div>
      {selectedLayer.id === 'thermal' && (
        <p className="coverage-note">Thermal coverage: approximately 65°S to 65°N.</p>
      )}
    </>
  );
}
