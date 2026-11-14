import { FASTAPI_URL } from '../constants/api';

export async function calculateRoutePlan({ source, destination, mode }) {
  const payload = {
    start: [Number(source.lat), Number(source.lng)],
    end: [Number(destination.lat), Number(destination.lng)],
    mode: mode
  };

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpBackend = FASTAPI_URL.startsWith('http://');

  // When frontend is served over HTTPS (such as Vercel) and backend is plain HTTP (e.g. AWS EC2 IP without SSL),
  // browsers block direct calls due to Mixed Content security rules.
  // We prioritize the relative '/api/plan-route' route which is securely proxied server-to-server!
  const endpoints = [];
  if (isHttps && isHttpBackend) {
    endpoints.push('/api/plan-route');
    endpoints.push(`${FASTAPI_URL}/api/plan-route`);
  } else {
    endpoints.push(`${FASTAPI_URL}/api/plan-route`);
    endpoints.push('/api/plan-route');
  }

  let lastError = null;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        continue;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.reason || data.error || `HTTP ${response.status}`);
      }

      const waypoints = data.waypoints || data.coordinates;
      if (Array.isArray(waypoints) && waypoints.length > 0) {
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message ||
    `Not connected to backend. Could not reach FastAPI server at ${FASTAPI_URL}. Ensure FASTAPI_URL or VITE_FASTAPI_URL is configured in your Vercel Project Settings.`
  );
}
