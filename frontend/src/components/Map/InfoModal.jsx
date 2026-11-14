import React from 'react';
import { X } from 'lucide-react';

export function InfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="info-pop">
      <button onClick={onClose} aria-label="Close">
        <X size={15} />
      </button>
      <strong>About Martian Map</strong>
      <p>
        Dual-scale Martian pathfinding engine connected to planetary routing services. Supports Jezero Crater 20m high-resolution
        DTM and planetary-scale MOLA elevation routing.
      </p>
      <a
        href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars"
        target="_blank"
        rel="noreferrer"
      >
        View NASA data catalog ↗
      </a>
    </div>
  );
}
