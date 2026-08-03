import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { aplicar, derivarMarca, renombrables, sustituciones } from './rename.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marca = JSON.parse(readFileSync(join(root, 'brand.json'), 'utf8'));

test('derivarMarca saca slug, scope y dominio del nombre visible', () => {
  const nueva = derivarMarca('MarcaNueva', marca);
  assert.equal(nueva.slug, 'marcanueva');
  assert.equal(nueva.scope, '@marcanueva');
  assert.equal(nueva.esquema, 'marcanueva');
  assert.match(nueva.dominioInverso, /\.marcanueva$/);
});

test('derivarMarca limpia acentos, espacios y símbolos', () => {
  assert.equal(derivarMarca('Mi Iglesia Ágil', marca).slug, 'miiglesiaagil');
  assert.equal(derivarMarca('Marca-2', marca).slug, 'marca2');
});

test('derivarMarca rechaza un nombre del que no sale slug', () => {
  assert.throws(() => derivarMarca('—', marca));
});

test('el dominio inverso conserva su prefijo', () => {
  const nueva = derivarMarca('MarcaNueva', { ...marca, dominioInverso: 'com.ejemplo' });
  assert.equal(nueva.dominioInverso, 'com.marcanueva');
});

/**
 * El orden de las sustituciones es lo único delicado de todo el script: si el
 * slug se aplicase antes que el scope o que el dominio inverso, los partiría
 * por la mitad y dejaría cosas como `@marcanueva` hecho `@marcanuevavieja`.
 *
 * El fixture usa nombres inventados A PROPÓSITO: con el nombre real del
 * proyecto, `pnpm rename` reescribiría también este test y dejaría de probar
 * nada, porque los dos lados de la comparación cambiarían a la vez.
 */
test('las formas largas se sustituyen antes que el slug', () => {
  const antes = {
    nombre: 'MarcaVieja',
    slug: 'marcavieja',
    scope: '@marcavieja',
    dominioInverso: 'org.marcavieja',
    esquema: 'marcavieja',
  };
  const cambios = sustituciones(antes, derivarMarca('MarcaNueva', antes));

  const muestra = [
    '"name": "@marcavieja/api"',
    'identifier: "org.marcavieja.desktop"',
    'const KEY = "marcavieja.theme";',
    'scheme: "marcavieja://"',
    '# MarcaVieja — herramientas',
  ].join('\n');

  const salida = aplicar(muestra, cambios);

  assert.match(salida, /"@marcanueva\/api"/);
  assert.match(salida, /"org\.marcanueva\.desktop"/);
  assert.match(salida, /"marcanueva\.theme"/);
  assert.match(salida, /"marcanueva:\/\//);
  assert.match(salida, /# MarcaNueva —/);
  assert.doesNotMatch(salida, /marcavieja/i);
});

test('no toca palabras que no son la marca', () => {
  const cambios = sustituciones(marca, derivarMarca('MarcaNueva', marca));
  const texto = 'Una frase cualquiera de la interfaz, sin la marca por ningún lado.';
  assert.equal(aplicar(texto, cambios), texto);
});

test('renombrar al mismo nombre no genera cambios', () => {
  assert.equal(sustituciones(marca, derivarMarca(marca.nombre, marca)).length, 0);
});

test('renombrables detecta los ficheros cuyo nombre lleva la marca', () => {
  const antes = {
    nombre: 'MarcaVieja',
    slug: 'marcavieja',
    scope: '@marcavieja',
    dominioInverso: 'org.marcavieja',
    esquema: 'marcavieja',
  };
  const cambios = sustituciones(antes, derivarMarca('MarcaNueva', antes));

  const rutas = [
    'docker/nginx/marcavieja.ejemplo.es.conf',
    'apps/web/src/lib/api.ts',
    'docs/MarcaVieja.md',
  ];

  assert.deepEqual(renombrables(cambios, rutas), [
    'docker/nginx/marcavieja.ejemplo.es.conf',
    'docs/MarcaVieja.md',
  ]);
  assert.equal(
    aplicar('docker/nginx/marcavieja.ejemplo.es.conf', cambios),
    'docker/nginx/marcanueva.ejemplo.es.conf',
  );
});
