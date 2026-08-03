#!/usr/bin/env node
/**
 * Genera el icono de web, móvil y escritorio a partir del logo oficial.
 *
 *   pnpm icons
 *
 * La fuente son los SVG de `packages/theme/src/logo/`. Para cambiar el logo se
 * sustituyen esos ficheros y se vuelve a ejecutar este comando: todo lo demás
 * es salida y no se toca a mano. Un test compara byte a byte lo que hay en el
 * repositorio con lo que sale de aquí.
 *
 * El encuadre lo decide `scripts/brand-logo.mjs`, que mide el dibujo y lo
 * centra: los SVG del diseñador traen mucho margen y a tamaño de favicon el
 * barco se quedaba en nada.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { AZUL, encuadrar, leerVariante } from './brand-logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Rasteriza un SVG a PNG cuadrado. */
export function aPng(svg, size) {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
}

/**
 * Qué se genera, con qué variante y con cuánto aire.
 *
 * `ocupacion` es la fracción del lado que ocupa el barco:
 * · Favicon: casi todo. Se ve a 16 px y cualquier margen se lo come.
 * · Iconos de aplicación: 0,72, el margen que esperan iOS y Android para que
 *   el icono no toque los bordes del recuadro.
 * · Maskable y primer plano adaptativo: bastante menos, porque el sistema
 *   recorta con la forma que le da la gana y hay que dejar zona segura.
 */
export const DESTINOS = [
  ['apps/web/public/favicon.svg', { variante: 'azul', ocupacion: 0.96, svg: true }],

  // Versiones encuadradas y transparentes que consume la interfaz. Van en un
  // subdirectorio `encuadrado/` para que quede claro que son salida, no las
  // originales del diseñador.
  ['packages/theme/src/logo/encuadrado/azul.svg', { variante: 'azul', ocupacion: 1, svg: true }],
  [
    'packages/theme/src/logo/encuadrado/blanco.svg',
    { variante: 'blanco', ocupacion: 1, svg: true },
  ],

  [
    'apps/web/public/pwa-192x192.png',
    { variante: 'blanco', ocupacion: 0.72, fondo: AZUL, size: 192 },
  ],
  [
    'apps/web/public/pwa-512x512.png',
    { variante: 'blanco', ocupacion: 0.72, fondo: AZUL, size: 512 },
  ],
  [
    'apps/web/public/pwa-maskable-512x512.png',
    { variante: 'blanco', ocupacion: 0.56, fondo: AZUL, size: 512 },
  ],
  [
    'apps/web/public/apple-touch-icon.png',
    // Sin esquinas redondeadas: iOS las pone él, y si vienen puestas se ven dobles.
    { variante: 'blanco', ocupacion: 0.72, fondo: AZUL, size: 180 },
  ],
  ['apps/mobile/assets/icon.png', { variante: 'blanco', ocupacion: 0.72, fondo: AZUL, size: 1024 }],
  ['apps/mobile/assets/adaptive-icon.png', { variante: 'blanco', ocupacion: 0.56, size: 1024 }],
  [
    'apps/mobile/assets/splash-icon.png',
    { variante: 'blanco', ocupacion: 0.62, fondo: AZUL, radio: 0.22, size: 512 },
  ],
  ['apps/mobile/assets/favicon.png', { variante: 'blanco', ocupacion: 0.8, fondo: AZUL, size: 48 }],
];

/** Contenido que le corresponde a un destino, sin escribir nada. */
export function contenidoDe([, opciones]) {
  const svg = encuadrar(leerVariante(opciones.variante), {
    ocupacion: opciones.ocupacion,
    fondo: opciones.fondo ?? null,
    radio: opciones.radio ?? 0,
  });

  return opciones.svg ? Buffer.from(svg, 'utf8') : aPng(svg, opciones.size);
}

export function generar({ silencioso = false } = {}) {
  for (const destino of DESTINOS) {
    const [ruta, opciones] = destino;
    const salida = join(root, ruta);
    mkdirSync(dirname(salida), { recursive: true });
    writeFileSync(salida, contenidoDe(destino));

    if (!silencioso) {
      const detalle = opciones.svg ? 'SVG' : `${String(opciones.size)}px`;
      console.log(
        `  ${ruta} — ${opciones.variante}, ${detalle}, ocupa ${String(Math.round(opciones.ocupacion * 100))}%`,
      );
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generar();

  const { scope } = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));

  console.log('\n  escritorio (tauri icon)…');
  try {
    // Comando entero y no argumentos sueltos: en Windows `pnpm` es un .cmd y
    // hace falta shell. `scope` sale de brand.json, que el renombrador escribe
    // ya saneado a [a-z0-9], así que no hay dónde inyectar nada.
    execSync(`pnpm --filter ${scope}/desktop icons`, { cwd: root, stdio: 'pipe' });
    console.log('  apps/desktop/src-tauri/icons/ — .ico, .icns y los PNG de cada tamaño');
  } catch {
    console.warn(
      '  ⚠ No he podido generar los iconos de escritorio.\n' +
        '    Necesitan las dependencias instaladas: pnpm install && pnpm icons',
    );
  }

  console.log('\n✓ Iconos regenerados desde packages/theme/src/logo/.\n');
}
