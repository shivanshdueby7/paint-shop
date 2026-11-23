import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const worker = { target: 'http://127.0.0.1:8787', changeOrigin: true };

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // A headless-browser profile once landed here and broke the file watcher.
    watch: { ignored: ['**/.chrome-shot/**'] },
    proxy: {
      '/api': worker,
      '/auth': worker,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
