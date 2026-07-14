import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/tests/setup.js'],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
    include: ['src/**/*.test.js'],
  },
});
