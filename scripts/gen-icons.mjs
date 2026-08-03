#!/usr/bin/env node
/**
 * Genera el icono de web, móvil y escritorio a partir del logo oficial.
 *
 *   pnpm icons
 *
 * La fuente son los SVG de `packages/theme/src/logo/`. Para cambiar el logo se
 * sustituyen esos ficheros y se vuelve a ejecutar este comando: todo lo demás
 * (favicon, iconos de la PWA, del móvil y del escritorio) es salida y no se
 * toca a mano. Un test compara byte a byte lo que hay en el repositorio con lo
 * que sale de aquí, así que un icono editado a mano hace fallar la verificación.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpetaLogo = join(root, 'packages/theme/src/logo');

/** Azul de la marca, tomado del propio logo. */
export const AZUL = '#2140cf';

/** Las tres variantes oficiales. */
export const VARIANTES = {
  azul: 'azul-sin-fondo.svg',
  blancoConFondo: 'blanco-con-fondo.svg',
  blancoSinFondo: 'blanco-sin-fondo.svg',
};

const leerVariante = (variante) => readFileSync(join(carpetaLogo, VARIANTES[variante]), 'utf8');

/**
 * Rodea el logo de un lienzo cuadrado: sirve para dejar aire alrededor (los
 * iconos «maskable» de Android recortan por los bordes) y para poner un fondo
 * sólido donde la transparencia quedaría mal.
 *
 * @param {string} svg          contenido del SVG original
 * @param {{ margen?: number, fondo?: string|null, radio?: number }} opciones
 *   `margen` es la fracción del lado que queda libre a cada lado.
 */
export function componer(svg, { margen = 0, fondo = null, radio = 0 } = {}) {
  const [, ancho = '1080', alto = '1080'] =
    /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)?.slice(0, 3) ?? [];
  const lado = Number(ancho);
  const escala = 1 - 2 * margen;
  const desplazamiento = lado * margen;

  // El SVG original se incrusta tal cual dentro de un <g> escalado: así no hay
  // que entender su contenido ni tocar sus rutas ni sus degradados.
  const interior = svg
    .replace(/<\?xml[^?]*\?>\s*/, '')
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');

  const rect =
    fondo === null
      ? ''
      : `<rect width="${String(lado)}" height="${String(alto)}" rx="${String(radio)}" fill="${fondo}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${String(lado)} ${alto}">
${rect}
<g transform="translate(${String(desplazamiento)} ${String(desplazamiento)}) scale(${escala.toFixed(4)})">
${interior}
</g>
</svg>`;
}

/** Rasteriza un SVG a PNG cuadrado. */
export function aPng(svg, size) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return Buffer.from(resvg.render().asPng());
}

/**
 * Qué variante va en cada sitio y por qué.
 *
 * · Pestaña del navegador → azul sin fondo, que es lo que pidió la marca.
 * · Pantalla de inicio, dock y tiendas → blanco sobre azul: un icono con
 *   transparencia ahí se ve roto.
 * · Maskable de Android → lo mismo pero con más aire, porque el sistema
 *   recorta por los bordes con la forma que le dé la gana.
 * · Foreground adaptativo de Android → blanco sin fondo; el color lo pone
 *   `adaptiveIcon.backgroundColor` en app.config.ts.
 */
export const DESTINOS = [
  ['apps/web/public/favicon.svg', { variante: 'azul', svg: true }],
  ['apps/web/public/pwa-192x192.png', { variante: 'blancoConFondo', size: 192 }],
  ['apps/web/public/pwa-512x512.png', { variante: 'blancoConFondo', size: 512 }],
  [
    'apps/web/public/pwa-maskable-512x512.png',
    { variante: 'blancoConFondo', size: 512, margen: 0.1, fondo: AZUL },
  ],
  ['apps/web/public/apple-touch-icon.png', { variante: 'blancoConFondo', size: 180 }],
  ['apps/mobile/assets/icon.png', { variante: 'blancoConFondo', size: 1024 }],
  [
    'apps/mobile/assets/adaptive-icon.png',
    { variante: 'blancoSinFondo', size: 1024, margen: 0.18 },
  ],
  ['apps/mobile/assets/splash-icon.png', { variante: 'blancoConFondo', size: 512, radio: 140 }],
  ['apps/mobile/assets/favicon.png', { variante: 'blancoConFondo', size: 48 }],
];

/** Contenido que le corresponde a un destino, sin escribir nada. */
export function contenidoDe([, opciones]) {
  const base = leerVariante(opciones.variante);
  const compuesto =
    opciones.margen || opciones.fondo || opciones.radio
      ? componer(base, {
          margen: opciones.margen ?? 0,
          fondo: opciones.fondo ?? null,
          radio: opciones.radio ?? 0,
        })
      : base;

  return opciones.svg ? Buffer.from(compuesto, 'utf8') : aPng(compuesto, opciones.size);
}

export function generar({ silencioso = false } = {}) {
  for (const destino of DESTINOS) {
    const [ruta, opciones] = destino;
    const salida = join(root, ruta);
    mkdirSync(dirname(salida), { recursive: true });
    writeFileSync(salida, contenidoDe(destino));

    if (!silencioso) {
      const detalle = opciones.svg ? 'SVG' : `${String(opciones.size)}px`;
      console.log(`  ${ruta} — ${opciones.variante}, ${detalle}`);
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
