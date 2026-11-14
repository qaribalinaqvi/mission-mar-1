import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { places } from '../../constants/places';

export function PlacesList({ onSelectPlace }) {
  return (
    <>
      <div className="section-title">
        <span><MapPin size={15} /> EXPLORATION SITES</span>
        <span className="count">{places.length}</span>
      </div>
      <div className="places">
        {places.slice(0, 5).map((p, idx) => (
          <button key={p.name} onClick={() => onSelectPlace(p)}>
            <span className="place-index">0{idx + 1}</span>
            <div className="place-name">
              {p.name}
              <small>{p.type}</small>
            </div>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
    </>
  );
}
