#!/usr/bin/env node
/**
 * Genera el icono para web, móvil y escritorio, todo desde la misma forma.
 *
 *   pnpm icons
 *
 * Escribe `packages/theme/src/brand-icon.svg`, el favicon y los PNG de cada
 * plataforma, y llama al CLI de Tauri para los del escritorio. La geometría
 * está en `scripts/brand-shape.mjs`: para cambiar el icono se toca ese fichero,
 * no los PNG ni el SVG, que son salida.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

import {
  COLOR_FONDO,
  COLOR_TRAZO,
  enFondo,
  enTrazo,
  LIENZO,
  RADIO_FONDO,
  svg,
} from './brand-shape.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const aRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const FONDO = aRgb(COLOR_FONDO);
const TRAZO = aRgb(COLOR_TRAZO);

// --- Codificador PNG mínimo (RGBA, sin dependencias) ------------------------

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xff_ff_ff_ff;
  for (const byte of buffer) crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

function trozo(tipo, datos) {
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([longitud, cuerpo, crc]);
}

function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // RGBA

  const crudo = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(crudo, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

// --- Rasterizado ------------------------------------------------------------

/**
 * @param {number} size lado en píxeles
 * @param {{ fondo?: boolean, margen?: number, radio?: number }} opciones
 *   `margen` encoge el dibujo: los iconos maskable de Android recortan por los
 *   bordes, así que necesitan más aire.
 */
export function dibujar(size, { fondo = true, margen = 0, radio = RADIO_FONDO } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const muestras = 4; // supermuestreo: bordes suaves también a 32 px

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let tinta = 0;
      let relleno = 0;

      for (let sy = 0; sy < muestras; sy++) {
        for (let sx = 0; sx < muestras; sx++) {
          const u = ((px + (sx + 0.5) / muestras) / size - 0.5) / (1 - margen) + 0.5;
          const v = ((py + (sy + 0.5) / muestras) / size - 0.5) / (1 - margen) + 0.5;
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;

          const x = u * LIENZO;
          const y = v * LIENZO;
          if (enTrazo(x, y)) tinta++;
          else if (enFondo(x, y, radio)) relleno++;
        }
      }

      const total = muestras * muestras;
      const cobertura = (tinta + (fondo ? relleno : 0)) / total;
      if (cobertura === 0) continue;

      const i = (py * size + px) * 4;
      const pesoTinta = tinta / Math.max(1, tinta + (fondo ? relleno : 0));
      const color = fondo ? FONDO : TRAZO;
      for (let canal = 0; canal < 3; canal++) {
        rgba[i + canal] = Math.round(color[canal] * (1 - pesoTinta) + TRAZO[canal] * pesoTinta);
      }
      rgba[i + 3] = Math.round(cobertura * 255);
    }
  }

  return png(size, rgba);
}

/**
 * Todo lo que produce `pnpm icons`. `size === null` significa SVG.
 * Los tests recorren esta lista para comprobar que no falta ningún sitio.
 */
export const DESTINOS = [
  ['packages/theme/src/brand-icon.svg', null, {}],
  ['apps/web/public/favicon.svg', null, {}],
  ['apps/web/public/pwa-192x192.png', 192, {}],
  ['apps/web/public/pwa-512x512.png', 512, {}],
  ['apps/web/public/pwa-maskable-512x512.png', 512, { margen: 0.24, radio: 0 }],
  ['apps/web/public/apple-touch-icon.png', 180, {}],
  ['apps/mobile/assets/icon.png', 1024, {}],
  ['apps/mobile/assets/adaptive-icon.png', 1024, { fondo: false, margen: 0.24 }],
  ['apps/mobile/assets/splash-icon.png', 512, { fondo: false }],
  ['apps/mobile/assets/favicon.png', 48, {}],
];

/** Contenido que le corresponde a cada destino, sin escribir nada. */
export function contenidoDe([, size, opciones], nombre) {
  return size === null ? Buffer.from(svg(nombre), 'utf8') : dibujar(size, opciones);
}

export function generar({ silencioso = false } = {}) {
  const { nombre, scope } = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));

  for (const destino of DESTINOS) {
    const [ruta, size] = destino;
    const salida = join(root, ruta);
    mkdirSync(dirname(salida), { recursive: true });
    writeFileSync(salida, contenidoDe(destino, nombre));

    if (!silencioso) {
      console.log(`  ${ruta} — ${size === null ? 'SVG' : `${String(size)}×${String(size)}`}`);
    }
  }

  return scope;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const scope = generar();

  // Tauri necesita .ico, .icns y una docena de tamaños: su CLI los saca del
  // PNG grande que se acaba de generar.
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

  console.log('\n✓ Iconos regenerados. Míralos antes de commitear.\n');
}
