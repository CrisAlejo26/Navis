import { listPublicPath } from '@navis/shared';

/**
 * El manifest de aplicación de **una lista publicada** (RFC 0010, ampliación
 * «PWA por lista»).
 *
 * Es lo que hace que instalarla como aplicación abra directamente la lista —o
 * su puerta, si es restringida— y no el inicio de sesión general: el
 * `start_url` y el `scope` son la propia ruta pública de la lista, no `/`. El
 * `id` va con el mismo valor a propósito, para que el navegador la trate como
 * una PWA distinta de «Navis a secas» (soportado desde Chrome 96 y Safari/iOS
 * 16.4, que es lo que permite tener varias aplicaciones instaladas desde el
 * mismo origen).
 *
 * El color y los iconos son los de Navis, sin variar por lista: resolver el
 * acento de la lista a hexadecimal vive en `apps/web` (`accentHex`, que
 * importa de `@navis/theme`), y la API no depende de ese paquete solo por
 * esto (Regla 1 §4).
 */
export interface ListManifestInput {
  origin: string;
  token: string;
  listName: string;
  churchName: string;
}

export function renderListManifest(input: ListManifestInput): object {
  const origin = input.origin.replace(/\/+$/, '');
  const startUrl = `${origin}${listPublicPath(input.token)}`;

  return {
    id: startUrl,
    name: `${input.listName} · ${input.churchName}`,
    short_name: input.listName.slice(0, 30),
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fcfcfa',
    theme_color: '#fcfcfa',
    icons: [
      { src: `${origin}/pwa-192x192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${origin}/pwa-512x512.png`, sizes: '512x512', type: 'image/png' },
      {
        src: `${origin}/pwa-maskable-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
