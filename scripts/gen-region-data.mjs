#!/usr/bin/env node
/**
 * Genera el dataset de comunidades/provincias del selector geográfico
 * (RFC 0011, ampliación), un fichero JSON por país en
 * `apps/web/src/lib/geo/regions/`.
 *
 *   node scripts/gen-region-data.mjs
 *
 * La fuente es `iso-3166-2.json` (Ola Holmström, licencia ISC,
 * https://github.com/olahol/iso-3166-2.json), que trae 237 países. Se
 * descartan aquí los tres códigos obsoletos que todavía arrastra (`AN`
 * Antillas Neerlandesas, `TP` Timor Oriental antiguo, `YU` Yugoslavia) y
 * cualquier código que no esté en `COUNTRY_CODES` de `packages/shared`, que es
 * la lista vigente.
 *
 * **España queda fuera a propósito.** La fuente mezcla en un mismo nivel las
 * diecinueve comunidades autónomas y sus provincias (`ES-AN` Andalucía junto
 * a `ES-AL` Almería, que es una de sus provincias), y solo las comunidades
 * son las que `date.nager.at` reconoce en los festivos regionales (RFC 0011
 * D9 original): una provincia elegida ahí no marcaría nunca ningún festivo.
 * España se queda con `ES_REGIONS` de `packages/shared`, verificada a mano
 * contra la fuente de festivos.
 *
 * No corre en cada instalación ni en CI: es una herramienta de mantenimiento,
 * como `gen-icons.mjs`. Se vuelve a ejecutar solo si ISO publica cambios en
 * las subdivisiones de algún país, o si la fuente corrige algo.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/web/src/lib/geo/regions');
const constantsFile = join(root, 'packages/shared/src/constants.ts');

const FUENTE = 'https://raw.githubusercontent.com/olahol/iso-3166-2.json/master/iso-3166-2.json';

/** Códigos que la fuente todavía trae pero ya no son ISO 3166-1 vigente. */
const OBSOLETOS = new Set(['AN', 'TP', 'YU']);

/**
 * Lee `COUNTRY_CODES` del propio código fuente, sin depender de que
 * `@navis/shared` esté compilado: es la única fuente de verdad de qué países
 * son válidos, y este script no necesita nada más de ese paquete.
 */
function paísesVigentes() {
  const source = readFileSync(constantsFile, 'utf8');
  const match = /export const COUNTRY_CODES = \[([\s\S]*?)] as const;/.exec(source);
  if (!match) throw new Error('No se encontró COUNTRY_CODES en constants.ts');

  const codes = [...match[1].matchAll(/'([A-Z]{2})'/g)].map((one) => one[1]);
  return new Set(codes);
}

async function main() {
  const vigentes = paísesVigentes();

  const response = await fetch(FUENTE);
  if (!response.ok) {
    throw new Error(`No se pudo descargar el dataset: ${String(response.status)}`);
  }
  const data = await response.json();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  let escritos = 0;
  for (const [code, entry] of Object.entries(data)) {
    if (code === 'ES' || OBSOLETOS.has(code) || !vigentes.has(code)) continue;

    const divisions = entry.divisions ?? {};
    if (Object.keys(divisions).length === 0) continue;

    writeFileSync(join(outDir, `${code}.json`), `${JSON.stringify(divisions, null, 2)}\n`);
    escritos++;
  }

  writeFileSync(join(outDir, 'README.md'), readmeContents(escritos, vigentes.size));

  console.log(
    `${String(escritos)} países con comunidades, de ${String(vigentes.size)} códigos vigentes.`,
  );
}

function readmeContents(escritos, totalPaíses) {
  return `# Comunidades del selector geográfico

Generado por \`scripts/gen-region-data.mjs\` — no se edita a mano.

**España no tiene fichero aquí a propósito**: usa \`ES_REGIONS\` de
\`packages/shared\`, verificada contra los festivos regionales de verdad (ver
la cabecera del script).

Fuente: [\`iso-3166-2.json\`](${FUENTE}) (Ola Holmström, licencia ISC).
${String(escritos)} de ${String(totalPaíses)} países vigentes tienen datos de
comunidad; el resto se queda sin ficheros aquí y el selector cae al código
ISO 3166-2 escrito a mano (ver \`region-field.tsx\`).

La cobertura y granularidad vienen tal cual de la fuente: algunos países solo
traen la división de primer nivel, otros mezclan niveles administrativos. Si
un país necesita corrección, se corrige en la fuente y se regenera, no aquí.
`;
}

main().catch((cause) => {
  console.error(cause);
  process.exitCode = 1;
});
