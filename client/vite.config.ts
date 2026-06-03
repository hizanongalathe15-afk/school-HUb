import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
  ,
  build: {
    // Increase chunk size warning limit (in KB) to reduce noisy warnings for large bundles
    chunkSizeWarningLimit: 2000
  }
});
