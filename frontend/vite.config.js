import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    strictPort: true,
  },
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: {
      // Support common source maps if needed
      'src': '/src',
    },
  },
});
