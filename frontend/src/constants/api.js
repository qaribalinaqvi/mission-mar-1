export const FASTAPI_URL = (
  import.meta.env.VITE_FASTAPI_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '');

export const NASA_TREK_ROOT = 'https://trek.nasa.gov/tiles/Mars/EQ/';
