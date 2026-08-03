#!/usr/bin/env node
/**
 * Genera los PNG del icono para web, móvil y escritorio.
 *
 *   pnpm icons
 *
 * La fuente es `packages/theme/src/brand-icon.svg`: un cayado de pastor. Nada
 * de cruces (ver .claude/rules/07-sin-cruces-en-la-identidad.md). Aquí se
 * redibuja la misma geometría a mano porque rasterizar SVG traería una
 * dependencia nativa (sharp/resvg) solo para esto.
 *
 * Si cambias el SVG, cambia también `dibujar()` y comprueba el resultado.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MARCA = [0x3b, 0x63, 0xbe]; // --light-primary de packages/theme
const TINTA = [0xff, 0xff, 0xff];

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

// --- Geometría del cayado (mismas coordenadas que el SVG, lienzo 64) --------

const distanciaASegmento = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

/** Con la Y hacia abajo, el ángulo 270° es «arriba». */
function enArco(px, py, cx, cy, radio, desde, hasta, grosor) {
  if (Math.abs(Math.hypot(px - cx, py - cy) - radio) > grosor / 2) return false;
  let angulo = (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
  while (angulo < desde) angulo += 360;
  return angulo <= hasta;
}

/** ¿Cae este punto (en coordenadas de 0 a 64) sobre el trazo del cayado? */
function enCayado(x, y) {
  const g = 6; // grosor del trazo, igual que el stroke-width del SVG
  return (
    distanciaASegmento(x, y, 27, 21, 27, 52) <= g / 2 ||
    enArco(x, y, 36, 21, 9, 180, 360, g) ||
    enArco(x, y, 40, 21, 5, 0, 180, g) ||
    Math.hypot(x - 35, y - 21) <= g / 2 // remate redondo de la punta
  );
}

/** ¿Cae dentro del cuadrado de esquinas redondeadas del fondo? */
function enFondo(x, y, radio) {
  const dx = Math.min(x, 64 - x);
  const dy = Math.min(y, 64 - y);
  if (dx >= radio || dy >= radio) return true;
  return (radio - dx) ** 2 + (radio - dy) ** 2 <= radio * radio;
}

/**
 * @param {number} size lado en píxeles
 * @param {{ fondo?: boolean, margen?: number, radio?: number }} opciones
 *   `margen` encoge el dibujo (los iconos maskable de Android recortan un 10 %
 *   por cada lado, así que necesitan más aire).
 */
function dibujar(size, { fondo = true, margen = 0, radio = 14 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const muestras = 4; // supermuestreo: bordes suaves también a 32 px

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let tinta = 0;
      let relleno = 0;

      for (let sy = 0; sy < muestras; sy++) {
        for (let sx = 0; sx < muestras; sx++) {
          // Píxel → coordenadas del lienzo de 64, aplicando el margen.
          const u = ((px + (sx + 0.5) / muestras) / size - 0.5) / (1 - margen) + 0.5;
          const v = ((py + (sy + 0.5) / muestras) / size - 0.5) / (1 - margen) + 0.5;
          const x = u * 64;
          const y = v * 64;

          if (u < 0 || u > 1 || v < 0 || v > 1) continue;
          if (enCayado(x, y)) tinta++;
          else if (enFondo(x, y, radio)) relleno++;
        }
      }

      const total = muestras * muestras;
      const i = (py * size + px) * 4;
      const cobertura = (tinta + (fondo ? relleno : 0)) / total;
      if (cobertura === 0) continue;

      // El trazo va sobre el fondo: se mezcla según cuánto ocupa cada uno.
      const pesoTinta = tinta / Math.max(1, tinta + (fondo ? relleno : 0));
      const color = fondo ? MARCA : TINTA;
      for (let canal = 0; canal < 3; canal++) {
        rgba[i + canal] = Math.round(color[canal] * (1 - pesoTinta) + TINTA[canal] * pesoTinta);
      }
      rgba[i + 3] = Math.round(cobertura * 255);
    }
  }

  return png(size, rgba);
}

// --- Qué se genera y dónde --------------------------------------------------

const destinos = [
  ['apps/web/public/pwa-192x192.png', 192, {}],
  ['apps/web/public/pwa-512x512.png', 512, {}],
  // Android recorta los maskable: el dibujo va más pequeño y sin esquinas.
  ['apps/web/public/pwa-maskable-512x512.png', 512, { margen: 0.24, radio: 0 }],
  ['apps/web/public/apple-touch-icon.png', 180, {}],
  ['apps/mobile/assets/icon.png', 1024, {}],
  ['apps/mobile/assets/adaptive-icon.png', 1024, { fondo: false, margen: 0.24 }],
  ['apps/mobile/assets/splash-icon.png', 512, { fondo: false }],
  ['apps/mobile/assets/favicon.png', 48, {}],
];

for (const [ruta, size, opciones] of destinos) {
  const destino = join(root, ruta);
  mkdirSync(dirname(destino), { recursive: true });
  const buffer = dibujar(size, opciones);
  writeFileSync(destino, buffer);
  console.log(`  ${ruta} — ${String(size)}×${String(size)} (${String(buffer.length)} B)`);
}

console.log('\nLos iconos de escritorio se generan aparte, desde el de móvil:');
console.log('  pnpm --filter @pastortools/desktop icons\n');
