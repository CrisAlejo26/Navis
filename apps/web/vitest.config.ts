import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const workspaceSource = (name: string): string =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: [
      // `virtual:pwa-register/react` lo inyecta el plugin de la PWA, que aquí
      // no está: sin este alias, cualquier test que monte el aviso de
      // actualización moriría con «cannot find module».
      {
        find: 'virtual:pwa-register/react',
        replacement: fileURLToPath(new URL('./src/test/pwa-register.ts', import.meta.url)),
      },
      // Mismo alias que `vite.config.ts`, y el mismo motivo (RFC 0019): sin
      // resolver al fuente, un componente que llama a un hook de mutación de
      // `@navis/api-client` (no pasado por prop, como `useChannelMenu`) monta
      // dentro de su propia copia de React Query, distinta de la que ve
      // `QueryClientProvider` en el test, y `useQueryClient()` revienta con
      // «No QueryClient set» aunque el proveedor esté ahí.
      { find: /^@navis\/api-client$/, replacement: workspaceSource('api-client') },
      { find: /^@navis\/i18n$/, replacement: workspaceSource('i18n') },
      { find: /^@navis\/shared$/, replacement: workspaceSource('shared') },
      { find: /^@navis\/theme$/, replacement: workspaceSource('theme') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
});
