/// <reference types="vite/client" />
/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig as defineVitestConfig } from 'vitest/config';

const viteConfig = defineConfig({
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
  }
});

const vitestConfig = defineVitestConfig({
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

export default mergeConfig(viteConfig, vitestConfig);
