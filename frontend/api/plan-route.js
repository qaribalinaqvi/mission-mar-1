export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const backendUrl = (
    process.env.FASTAPI_URL ||
    process.env.VITE_FASTAPI_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '');

  try {
    const response = await fetch(`${backendUrl}/api/plan-route`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' && req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    return res.status(502).json({
      error: 'Backend Connection Failed',
      detail: `Unable to reach FastAPI backend at ${backendUrl}: ${error.message}`
    });
  }
}
