/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

// Note: @vitejs/plugin-react is not needed here because none of the test
// files contain JSX — they are all plain .ts files that test pure utilities
// and hooks via renderHook (JSX-free).
export default defineConfig({
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      // Force a single React copy: @testing-library loads root react-dom → root react,
      // so point Vite's ESM resolution to the same root copies.
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/utils': path.resolve(__dirname, './src/services/utils'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
