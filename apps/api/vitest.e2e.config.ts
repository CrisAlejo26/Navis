import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Tests end-to-end: levantan la app real contra la base de datos de test.
 * Requiere Postgres en marcha (`pnpm db:up`) y las migraciones aplicadas.
 */
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
