import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_FASTAPI_URL || env.VITE_API_URL || 'http://localhost:8000';

  return {
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true
        }
      }
    }
  };
});
