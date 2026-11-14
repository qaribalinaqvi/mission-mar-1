import L from 'leaflet';

export const landmarkIcon = (name) =>
  L.divIcon({
    className: 'landmark-icon',
    html: `<span class="landmark-dot"></span><span class="landmark-label">${name}</span>`,
    iconSize: [160, 28],
    iconAnchor: [8, 14],
    popupAnchor: [0, -12]
  });

export const routeIcon = (label, color = '#d48762') =>
  L.divIcon({
    className: 'route-point-icon',
    html: `<span style="background:${color}">${label}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
