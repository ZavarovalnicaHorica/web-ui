import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local stand-in for the API gateway: the browser calls /api/auth/... on this server,
    // and Vite forwards it to auth-service as /auth/... (same origin, so no CORS needed).
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8081',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
