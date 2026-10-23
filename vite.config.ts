import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error - import mjs backend in vite config
import { handleApiRequest } from './server/aiBackend.mjs';

function aiBackendPlugin(): Plugin {
  return {
    name: 'signbridge-ai-backend',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          await handleApiRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          await handleApiRequest(req, res);
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiBackendPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
