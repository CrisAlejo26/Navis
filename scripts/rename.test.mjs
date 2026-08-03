import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { aplicar, derivarMarca, sustituciones } from './rename.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marca = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));

test('derivarMarca saca slug, scope y dominio del nombre visible', () => {
  const nueva = derivarMarca('Fidus', marca);
  assert.equal(nueva.slug, 'fidus');
  assert.equal(nueva.scope, '@fidus');
  assert.equal(nueva.esquema, 'fidus');
  assert.match(nueva.dominioInverso, /\.fidus$/);
});

test('derivarMarca limpia acentos, espacios y símbolos', () => {
  assert.equal(derivarMarca('Mi Iglesia Ágil', marca).slug, 'miiglesiaagil');
  assert.equal(derivarMarca('Fidus-2', marca).slug, 'fidus2');
});

test('derivarMarca rechaza un nombre del que no sale slug', () => {
  assert.throws(() => derivarMarca('—', marca));
});

test('el dominio inverso conserva su prefijo', () => {
  const nueva = derivarMarca('Fidus', { ...marca, dominioInverso: 'com.ejemplo' });
  assert.equal(nueva.dominioInverso, 'com.fidus');
});

/**
 * El orden de las sustituciones es lo único delicado de todo el script: si el
 * slug se aplicase antes que el scope o que el dominio inverso, los partiría
 * por la mitad y dejaría cosas como `@fidus` convertido en `@fidustools`.
 */
test('las formas largas se sustituyen antes que el slug', () => {
  const antes = {
    nombre: 'PastorTools',
    slug: 'pastortools',
    scope: '@pastortools',
    dominioInverso: 'org.pastortools',
    esquema: 'pastortools',
  };
  const cambios = sustituciones(antes, derivarMarca('Fidus', antes));

  const muestra = [
    '"name": "@pastortools/api"',
    'identifier: "org.pastortools.desktop"',
    'const KEY = "pastortools.theme";',
    'scheme: "pastortools://"',
    '# PastorTools — herramientas',
  ].join('\n');

  const salida = aplicar(muestra, cambios);

  assert.match(salida, /"@fidus\/api"/);
  assert.match(salida, /"org\.fidus\.desktop"/);
  assert.match(salida, /"fidus\.theme"/);
  assert.match(salida, /"fidus:\/\/"/);
  assert.match(salida, /# Fidus —/);
  assert.doesNotMatch(salida, /pastortools/i);
});

test('no toca palabras que no son la marca', () => {
  const cambios = sustituciones(marca, derivarMarca('Fidus', marca));
  const texto = 'El pastor visita a los creyentes; PASTOR en mayúsculas también.';
  assert.equal(aplicar(texto, cambios), texto);
});

test('renombrar al mismo nombre no genera cambios', () => {
  assert.equal(sustituciones(marca, derivarMarca(marca.nombre, marca)).length, 0);
});
