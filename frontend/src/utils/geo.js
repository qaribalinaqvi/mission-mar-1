export function coord(n, positive, negative) {
  return `${Math.abs(n).toFixed(2)}° ${n >= 0 ? positive : negative}`;
}

// Break lines at the antimeridian so Leaflet never draws across the entire map
export function splitRoute(points) {
  if (!points || !points.length) return [];
  const normalized = points.map((p) => {
    if (Array.isArray(p)) return { lat: p[0], lng: p[1] };
    return { lat: p.lat ?? p[0], lng: p.lng ?? p[1] };
  });

  const segments = [[[normalized[0].lat, normalized[0].lng]]];
  for (let i = 1; i < normalized.length; i++) {
    const a = normalized[i - 1];
    const b = normalized[i];
    if (Math.abs(b.lng - a.lng) > 180) {
      const end = a.lng > 0 ? 180 : -180;
      const adjusted = b.lng + (a.lng > 0 ? 360 : -360);
      const lat = a.lat + ((b.lat - a.lat) * (end - a.lng)) / (adjusted - a.lng);
      segments[segments.length - 1].push([lat, end]);
      segments.push([[lat, -end], [b.lat, b.lng]]);
    } else {
      segments[segments.length - 1].push([b.lat, b.lng]);
    }
  }
  return segments;
}

export function getVerdictStyle(verdict) {
  switch (verdict) {
    case 'SAFE':
    case 'GO':
      return { color: '#38bdf8', label: 'SAFE CORRIDOR', bg: '#082f49', border: '#0284c7' };
    case 'CAUTION':
      return { color: '#fbbf24', label: 'CAUTION ADVISORY', bg: '#451a03', border: '#d97706' };
    case 'NO-GO':
      return { color: '#f87171', label: 'NO-GO UNTRAVERSABLE', bg: '#450a0a', border: '#dc2626' };
    default:
      return { color: '#ffb77e', label: verdict || 'CALCULATED', bg: '#292524', border: '#78716c' };
  }
}
