import React, { useState } from 'react';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { places } from '../../constants/places';

export function SearchBar({ onSelectPlace }) {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (p) => {
    onSelectPlace(p);
    setSearch('');
    setFocused(false);
  };

  return (
    <div className="search-wrap">
      <Search size={17} />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filtered[0]) handleSelect(filtered[0]);
          if (e.key === 'Escape') setFocused(false);
        }}
        placeholder="Search places on Mars..."
      />
      <span className="search-key">/</span>
      {focused && search && (
        <div className="search-results">
          {filtered.length ? (
            filtered.map((p) => (
              <button key={p.name} onClick={() => handleSelect(p)}>
                <MapPin size={15} />
                <span>
                  {p.name}
                  <small>{p.type}</small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))
          ) : (
            <div className="no-results">No matching places found</div>
          )}
        </div>
      )}
    </div>
  );
}
