import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type UserConfig } from 'vite';

// Resolve the library from source so the playground always matches the branch
// it is built from, without a separate package build step.
const config: UserConfig = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-data-export': fileURLToPath(
        new URL('../../packages/react-data-export/src/index.ts', import.meta.url),
      ),
    },
  },
});

export default config;
