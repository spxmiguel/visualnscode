import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'packages/**/*.test.{ts,tsx}',
      'apps/desktop/src/renderer/**/*.test.{ts,tsx}',
      'apps/desktop/src/shared/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
