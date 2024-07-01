/// <reference types="vite/client" />
/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  build: {
    minify: 'esbuild',
    outDir: 'build'
  },
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr({
      include: '**/*.svg?react'
    })
  ],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/assets'),
      '@api/*': path.resolve(__dirname, './src/api'),
      '@utils/*': path.resolve(__dirname, './src/utils'),
      '@representations/*': path.resolve(__dirname, './src/representations'),
      '@shared/*': path.resolve(__dirname, './src/components/shared')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*']
    }
  }
});
