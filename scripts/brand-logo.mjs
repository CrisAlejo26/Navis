/**
 * Encuadre del logo.
 *
 * Los SVG que entrega el diseñador traen mucho aire alrededor del barco: en un
 * lienzo de 1080 el dibujo ocupa un 69 % de ancho y un 62 % de alto, y además
 * está descentrado. Servido tal cual, en un favicon de 16 px el barco se queda
 * en nada.
 *
 * Aquí se mide el dibujo de verdad (rasterizando y buscando los píxeles
 * opacos) y se reencuadra en un lienzo cuadrado con la proporción que se pida.
 * Así el encuadre lo decidimos nosotros para cada destino, y si mañana llega
 * un logo con otros márgenes, se ajusta solo.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '../packages/theme/src/logo');

/** Azul de la marca, tomado del propio logo. */
export const AZUL = '#2140cf';

export const VARIANTES = {
  azul: 'azul-sin-fondo.svg',
  blanco: 'blanco-sin-fondo.svg',
};

export const leerVariante = (variante) => readFileSync(join(carpeta, VARIANTES[variante]), 'utf8');

/** Resolución a la que se mide. Suficiente para un encuadre estable. */
const MUESTREO = 512;

const cache = new Map();

/**
 * Caja del dibujo dentro de su lienzo, en fracciones de 0 a 1.
 * Solo vale para las variantes SIN fondo: con un rectángulo de fondo, la caja
 * sería el lienzo entero.
 */
export function cajaDelDibujo(svg) {
  const enCache = cache.get(svg);
  if (enCache) return enCache;

  const imagen = new Resvg(svg, { fitTo: { mode: 'width', value: MUESTREO } }).render();
  const pixeles = imagen.pixels;

  let minX = MUESTREO;
  let minY = MUESTREO;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < MUESTREO; y++) {
    for (let x = 0; x < MUESTREO; x++) {
      // Umbral bajo: el antialias de los bordes no debe recortar el dibujo.
      if (pixeles[(y * MUESTREO + x) * 4 + 3] <= 8) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error('El SVG no pinta nada: no se puede encuadrar.');

  const caja = {
    x: minX / MUESTREO,
    y: minY / MUESTREO,
    ancho: (maxX - minX + 1) / MUESTREO,
    alto: (maxY - minY + 1) / MUESTREO,
  };

  cache.set(svg, caja);
  return caja;
}

const lienzoDe = (svg) => Number(/viewBox="0 0 ([\d.]+)/.exec(svg)?.[1] ?? 1080);

/**
 * Reencuadra el logo en un cuadrado donde su lado mayor ocupa `ocupacion`.
 *
 * @param {string} svg        variante SIN fondo
 * @param {object} opciones
 * @param {number} opciones.ocupacion  fracción del lado que ocupa el dibujo
 * @param {string|null} opciones.fondo color de fondo, o null para transparente
 * @param {number} opciones.radio      radio de las esquinas, en fracción del lado
 */
export function encuadrar(svg, { ocupacion = 1, fondo = null, radio = 0 } = {}) {
  const lienzo = lienzoDe(svg);
  const caja = cajaDelDibujo(svg);

  // Lado del cuadrado final, en unidades del SVG original.
  const mayor = Math.max(caja.ancho, caja.alto) * lienzo;
  const lado = mayor / ocupacion;

  // Desplazamiento que centra el dibujo en ese cuadrado.
  const dx = (lado - caja.ancho * lienzo) / 2 - caja.x * lienzo;
  const dy = (lado - caja.alto * lienzo) / 2 - caja.y * lienzo;

  const interior = svg
    .replace(/<\?xml[^?]*\?>\s*/, '')
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');

  const n = (valor) => Number(valor.toFixed(2));
  const rect =
    fondo === null
      ? ''
      : `  <rect width="${String(n(lado))}" height="${String(n(lado))}" rx="${String(n(radio * lado))}" fill="${fondo}" />\n`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${String(n(lado))} ${String(n(lado))}">
${rect}  <g transform="translate(${String(n(dx))} ${String(n(dy))})">
${interior}
  </g>
</svg>
`;
}
