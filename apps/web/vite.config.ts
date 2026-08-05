import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const workspaceSource = (name: string): string =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  // Un único .env en la raíz del monorepo para api, web, docker y migraciones.
  envDir: '../..',

  /**
   * Los paquetes del workspace se resuelven a su código fuente, no a su `dist`.
   *
   * Su `dist` es CommonJS (`@navis/tsconfig` los deja en NodeNext, que es lo
   * que necesitan la API y Metro) y Vite no pre-empaqueta las dependencias
   * enlazadas: en `pnpm dev` las servía en crudo y el navegador reventaba con
   * «does not provide an export named …». Y forzar el pre-empaquetado tampoco
   * vale: cada paquete se llevaba dentro su propia copia de React Query, con lo
   * que los hooks quedaban fuera del QueryClientProvider de la aplicación.
   *
   * Desde el fuente no pasa ninguna de las dos cosas, hay recarga en caliente al
   * tocar un paquete y no hace falta compilarlos antes de arrancar.
   *
   * Las expresiones son de coincidencia EXACTA a propósito: las subrutas
   * (`@navis/theme/tokens.css`, `@navis/theme/logo/*`) tienen que seguir
   * saliendo del `exports` del paquete.
   */
  resolve: {
    alias: [
      { find: /^@navis\/api-client$/, replacement: workspaceSource('api-client') },
      { find: /^@navis\/i18n$/, replacement: workspaceSource('i18n') },
      { find: /^@navis\/shared$/, replacement: workspaceSource('shared') },
      { find: /^@navis\/theme$/, replacement: workspaceSource('theme') },
    ],
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Navis',
        short_name: 'Navis',
        description: 'Herramientas para pastores: agenda, creyentes, profecías, sueños y más',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fcfcfa',
        theme_color: '#fcfcfa',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        /*
         * **Lo que el service worker no debe contestar** (RFC 0010 D15).
         *
         * Sin esto, una vez instalado responde `index.html` a *cualquier*
         * navegación —incluida `/l/<token>`— y la petición **nunca llega a
         * nginx ni a la API**: el enlace público funcionaría en un teléfono
         * cualquiera y fallaría justo en el de quien tiene la aplicación
         * instalada, que es quien lo comparte.
         */
        navigateFallbackDenylist: [/^\/l\//, /^\/api\//],
        runtimeCaching: [
          {
            // La API siempre primero por red; la caché solo salva el modo avión.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navis-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'navis-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Rollup 5 (Vite 8) ya no admite la forma de objeto: solo función.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/.test(id)) return 'react';
          if (id.includes('@tanstack')) return 'query';
          if (/i18next/.test(id)) return 'i18n';
          return undefined;
        },
      },
    },
  },
});
