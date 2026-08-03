import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/**
 * Genera los iconos de la PWA (192, 512, maskable y apple-touch) a partir del
 * SVG de marca:  pnpm --filter @fidus/web pwa-assets
 */
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
});
