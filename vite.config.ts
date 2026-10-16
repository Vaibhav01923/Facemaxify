import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // API calls go to the backend; /api/_lib/* are shared modules the app itself imports.
          '^/api/(?!_lib/)': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      // AI keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) are server-only: never inline them via `define`.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
