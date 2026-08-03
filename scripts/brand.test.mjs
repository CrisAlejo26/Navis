/**
 * Comprueba que la marca —nombre e icono— está aplicada de verdad en todas
 * partes. Es la red de seguridad de `pnpm rename` y `pnpm icons`: si alguno se
 * deja un sitio, aquí salta.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { contenidoDe, DESTINOS } from './gen-icons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(root, ruta), 'utf8');
const json = (ruta) => JSON.parse(leer(ruta));

const marca = json('brand.json');

// --- Ni rastro de los nombres anteriores -------------------------------------

/**
 * El proyecto se ha llamado antes de otras maneras. Un nombre viejo que
 * sobrevive en un fichero no es cosmética: es lo que hizo que la base de datos
 * local y las imágenes del servidor siguieran con el nombre antiguo.
 */
test('ningún nombre anterior sobrevive en el repositorio', () => {
  const anteriores = leer('docker/marcas-anteriores.txt')
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea && !linea.startsWith('#'));

  assert.ok(anteriores.length > 0, 'la lista de marcas anteriores no debería estar vacía');

  // El propio fichero que las documenta queda fuera, obviamente.
  const exento = new Set(['docker/marcas-anteriores.txt']);
  const binario = new Set(['.png', '.jpg', '.jpeg', '.ico', '.icns', '.gif', '.webp', '.pdf']);

  const ficheros = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .filter((ruta) => !exento.has(ruta) && !binario.has(extname(ruta).toLowerCase()));

  const culpables = [];
  for (const ruta of ficheros) {
    const texto = leer(ruta).toLowerCase();
    const encontrados = anteriores.filter(
      (vieja) => texto.includes(vieja) || ruta.toLowerCase().includes(vieja),
    );
    if (encontrados.length > 0) culpables.push(`${ruta} → ${encontrados.join(', ')}`);
  }

  assert.deepEqual(culpables, [], `quedan nombres antiguos:\n${culpables.join('\n')}`);
});

// --- El nombre ---------------------------------------------------------------

test('el paquete raíz se llama como el slug de la marca', () => {
  assert.equal(json('package.json').name, marca.slug);
});

test('todos los paquetes del workspace usan el scope de la marca', () => {
  const paquetes = [
    'apps/api',
    'apps/web',
    'apps/mobile',
    'apps/desktop',
    'packages/shared',
    'packages/theme',
    'packages/i18n',
    'packages/api-client',
    'packages/eslint-config',
    'packages/tsconfig',
  ];

  for (const ruta of paquetes) {
    const { name } = json(`${ruta}/package.json`);
    assert.ok(
      name.startsWith(`${marca.scope}/`),
      `${ruta} se llama «${name}» y debería empezar por ${marca.scope}/`,
    );
  }
});

test('el identificador nativo de escritorio sale del dominio inverso', () => {
  assert.equal(
    json('apps/desktop/src-tauri/tauri.conf.json').identifier,
    `${marca.dominioInverso}.desktop`,
  );
});

test('el identificador nativo de móvil sale del dominio inverso', () => {
  const config = leer('apps/mobile/app.config.ts');
  assert.ok(config.includes(`'${marca.dominioInverso}.app'`), 'falta el package/bundle de móvil');
});

test('el esquema de enlaces profundos es el de la marca', () => {
  assert.ok(leer('apps/mobile/app.config.ts').includes(`?? '${marca.esquema}'`));
  assert.ok(leer('.env.example').includes(`EXPO_PUBLIC_APP_SCHEME=${marca.esquema}`));
});

test('las claves de almacenamiento llevan el slug', () => {
  assert.ok(leer('packages/theme/src/theme-store.ts').includes(`'${marca.slug}.theme'`));
  assert.ok(leer('apps/web/src/lib/i18n.ts').includes(`'${marca.slug}.locale'`));
});

test('el crate de Rust se llama como la marca', () => {
  assert.ok(leer('apps/desktop/src-tauri/Cargo.toml').includes(`name = "${marca.slug}-desktop"`));
});

test('los proyectos de docker compose llevan el slug', () => {
  assert.ok(leer('docker-compose.yml').includes(`name: ${marca.slug}`));
  assert.ok(leer('docker-compose.prod.yml').includes(`name: ${marca.slug}-prod`));
});

test('el nombre visible está en el manifest de la PWA y en la app móvil', () => {
  assert.ok(leer('apps/web/vite.config.ts').includes(`name: '${marca.nombre}'`));
  assert.ok(leer('apps/mobile/app.config.ts').includes(`name: '${marca.nombre}'`));
});

// --- El icono ----------------------------------------------------------------

test('los iconos del repositorio son exactamente los que genera el script', () => {
  for (const destino of DESTINOS) {
    const [ruta] = destino;
    const enDisco = readFileSync(join(root, ruta));
    const esperado = contenidoDe(destino);

    assert.ok(
      enDisco.equals(esperado),
      `${ruta} no coincide con lo que genera el script: ejecuta \`pnpm icons\``,
    );
  }
});

test('los PNG generados tienen la firma y el tamaño que dicen', () => {
  const FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  for (const [ruta, opciones] of DESTINOS) {
    if (opciones.svg) continue;
    const size = opciones.size;
    const buffer = readFileSync(join(root, ruta));
    assert.ok(buffer.subarray(0, 8).equals(FIRMA), `${ruta} no es un PNG`);
    // Ancho y alto viven en el trozo IHDR, justo después de la firma.
    assert.equal(buffer.readUInt32BE(16), size, `${ruta} no mide ${String(size)} de ancho`);
    assert.equal(buffer.readUInt32BE(20), size, `${ruta} no mide ${String(size)} de alto`);
  }
});

test('el icono de escritorio existe en los formatos que pide Tauri', () => {
  for (const fichero of ['icon.ico', 'icon.icns', '128x128.png', '32x32.png']) {
    assert.ok(
      readFileSync(join(root, 'apps/desktop/src-tauri/icons', fichero)).length > 0,
      `falta apps/desktop/src-tauri/icons/${fichero}`,
    );
  }
});
