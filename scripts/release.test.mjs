/**
 * Tests del script de release, con el runner que trae Node: no merece la pena
 * montar Vitest en la raíz solo para esto.
 *
 *   pnpm test:scripts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { androidVersionCode, nextVersion, replacements } from './release.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('nextVersion sube el trozo que toca', () => {
  assert.equal(nextVersion('0.1.0', 'patch'), '0.1.1');
  assert.equal(nextVersion('0.1.9', 'minor'), '0.2.0');
  assert.equal(nextVersion('0.9.9', 'major'), '1.0.0');
  assert.equal(nextVersion('0.1.0', '1.4.2'), '1.4.2');
});

test('nextVersion rechaza lo que no entiende', () => {
  assert.throws(() => nextVersion('0.1.0', 'siguiente'));
});

test('androidVersionCode siempre crece', () => {
  assert.equal(androidVersionCode('1.4.2'), 10_402);
  assert.ok(androidVersionCode('0.2.0') > androidVersionCode('0.1.99'));
  assert.ok(androidVersionCode('1.0.0') > androidVersionCode('0.99.99'));
});

test('la versión actual se encuentra en todos los ficheros', () => {
  const actual = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

  for (const { file, pattern, replacement } of replacements(actual, '9.9.9')) {
    const before = readFileSync(join(root, file), 'utf8');
    assert.notEqual(
      before.replace(pattern, replacement),
      before,
      `${file} no contiene la versión ${actual}: el release se quedaría a medias`,
    );
  }
});

test('en Cargo.lock solo cambia nuestro paquete', () => {
  const actual = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const spec = replacements(actual, '9.9.9').at(-1);
  const path = join(root, 'apps/desktop/src-tauri/Cargo.lock');

  const before = readFileSync(path, 'utf8').split('\n');
  const after = readFileSync(path, 'utf8').replace(spec.pattern, spec.replacement).split('\n');
  const distintas = before.filter((line, index) => line !== after[index]);

  // Muchas dependencias comparten número de versión con nosotros: si el patrón
  // fuese más laxo, este test los cazaría.
  assert.equal(distintas.length, 1);
});
