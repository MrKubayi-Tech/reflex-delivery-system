import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local dev only: forwards /api/* to the PHP built-in server so the
      // browser never needs to know the backend's real host/port.
      // Production deploys the two behind the same reverse proxy instead.
      '/api': {
        target: 'http://127.0.0.1:8099',
        changeOrigin: true,
      },
    },
  },
});
