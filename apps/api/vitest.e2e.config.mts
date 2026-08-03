import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Tests end-to-end: levantan la app real contra la base de datos configurada
 * en el .env. Con `DB_DRIVER=sqlite` no hace falta nada más; con
 * `DB_DRIVER=postgres`, arranca antes `pnpm db:up && pnpm db:migrate`.
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
    server: {
      deps: {
        // Módulos nativos y de base de datos: los tiene que cargar Node, no
        // Vite. Si pasan por su transformación, el `.node` binario de
        // better-sqlite3 explota con «Invalid or unexpected token».
        external: [/better-sqlite3/, /^pg$/, /typeorm/, /better-auth/],
      },
    },
  },
});
