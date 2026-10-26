import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      'myth-ceremony-avenging.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/dicom-web': {
        target: 'http://127.0.0.1:8042',
        changeOrigin: true,
      },
      '/ohif': {
        target: 'http://127.0.0.1:8042',
        changeOrigin: true,
      },
      '/wado': {
        target: 'http://127.0.0.1:8042',
        changeOrigin: true,
      },
    },
  },
});
