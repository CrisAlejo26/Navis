#!/usr/bin/env node
/**
 * Publica una versión nueva de Navis.
 *
 *   pnpm release patch            0.1.0 → 0.1.1
 *   pnpm release minor            0.1.0 → 0.2.0
 *   pnpm release major            0.1.0 → 1.0.0
 *   pnpm release 1.4.2            versión concreta
 *   pnpm release patch --dry-run  enseña qué haría, sin tocar nada
 *   pnpm release patch --skip-checks
 *
 * Sincroniza la versión en todos los sitios donde vive, crea la etiqueta y la
 * empuja. A partir de ahí manda `.github/workflows/release.yml`, que compila
 * los instaladores de escritorio y el APK de Android y los publica en la
 * página de releases de GitHub. Ver docs/RELEASES.md.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const run = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', stdio: 'pipe', ...opts }).trim();

const git = (...cmdArgs) => run('git', cmdArgs);

/** Error de uso: mensaje claro y fuera. No hay nada que recuperar. */
class ReleaseError extends Error {}

const fail = (message) => {
  throw new ReleaseError(message);
};

export function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;

  const [major, minor, patch] = current.split('.').map(Number);
  if (bump === 'major') return `${String(major + 1)}.0.0`;
  if (bump === 'minor') return `${String(major)}.${String(minor + 1)}.0`;
  if (bump === 'patch') return `${String(major)}.${String(minor)}.${String(patch + 1)}`;

  return fail(`No entiendo «${bump}». Usa patch, minor, major o una versión como 1.4.2.`);
}

/**
 * Android exige un entero que SIEMPRE crezca; si baja, el teléfono rechaza la
 * actualización. Se deriva de la versión para no llevar la cuenta a mano:
 * 1.4.2 → 10402. `apps/mobile/app.config.ts` hace exactamente lo mismo.
 */
export function androidVersionCode(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

/** Ficheros donde vive la versión, con el patrón exacto que hay que sustituir. */
export function replacements(from, to) {
  const escaped = from.replaceAll('.', String.raw`\.`);

  return [
    ...[
      'package.json',
      'apps/api/package.json',
      'apps/web/package.json',
      'apps/mobile/package.json',
      'apps/desktop/package.json',
      'apps/desktop/src-tauri/tauri.conf.json',
    ].map((file) => ({
      file,
      pattern: new RegExp(String.raw`("version"\s*:\s*)"${escaped}"`),
      replacement: `$1"${to}"`,
    })),
    {
      // De aquí sale también el `versionCode` de Android, que se calcula solo.
      file: 'apps/mobile/app.config.ts',
      pattern: new RegExp(`(const version = )'${escaped}'`),
      replacement: `$1'${to}'`,
    },
    {
      file: 'apps/desktop/src-tauri/Cargo.toml',
      pattern: new RegExp(String.raw`(^version\s*=\s*)"${escaped}"`, 'm'),
      replacement: `$1"${to}"`,
    },
    {
      // Solo la entrada de NUESTRO paquete en el lockfile, no las dependencias.
      file: 'apps/desktop/src-tauri/Cargo.lock',
      pattern: new RegExp(String.raw`(name = "navis-desktop"\nversion = )"${escaped}"`),
      replacement: `$1"${to}"`,
    },
  ];
}

/** Aplica la versión nueva en todos los ficheros. Devuelve los que ha tocado. */
export function applyVersion(from, to, { dryRun = false } = {}) {
  const tocados = [];

  for (const { file, pattern, replacement } of replacements(from, to)) {
    const path = join(root, file);
    const before = readFileSync(path, 'utf8');
    const after = before.replace(pattern, replacement);

    if (before === after) fail(`No he encontrado la versión ${from} en ${file}.`);

    if (!dryRun) writeFileSync(path, after);
    tocados.push(file);
  }

  return tocados;
}

function comprobarEstadoDelRepositorio() {
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch !== 'main') fail(`Los releases salen de main, y estás en «${branch}».`);

  // Sin remoto no hay a dónde empujar la etiqueta, y por tanto no se dispara
  // el workflow que compila las descargas.
  if (!git('remote')) {
    fail(
      'Este repositorio no tiene remoto. Crea el proyecto en GitHub y añádelo:\n' +
        '    git remote add origin git@github.com:<usuario>/Navis.git\n' +
        '    git push -u origin main',
    );
  }

  if (git('status', '--porcelain')) {
    fail('Tienes cambios sin commitear. Un release tiene que salir de un árbol limpio.');
  }

  try {
    git('fetch', '--tags', '--quiet');
    const behind = git('rev-list', '--count', 'HEAD..@{u}');
    if (behind !== '0') fail(`Tu main está ${behind} commits por detrás del remoto. Haz pull.`);
  } catch (error) {
    if (error instanceof ReleaseError) throw error;
    console.warn('⚠ No he podido comparar con el remoto; sigo adelante.');
  }
}

function main(argv) {
  const dryRun = argv.includes('--dry-run');
  const skipChecks = argv.includes('--skip-checks');
  const bump = argv.find((arg) => !arg.startsWith('--')) ?? 'patch';

  comprobarEstadoDelRepositorio();

  const current = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const version = nextVersion(current, bump);
  const tag = `v${version}`;

  if (git('tag', '--list', tag)) fail(`La etiqueta ${tag} ya existe.`);

  console.log(`\n📦 Navis ${current} → ${version}  (etiqueta ${tag})`);
  console.log(`   versionCode de Android: ${String(androidVersionCode(version))}\n`);

  if (skipChecks) {
    console.warn('⚠ Te has saltado las verificaciones. La CI las repetirá igualmente.\n');
  } else if (dryRun) {
    console.log('▶ (simulado) aquí correría `pnpm check`\n');
  } else {
    console.log('▶ Verificando (formato, lint, tipos y tests)…');
    try {
      run('pnpm', ['check'], { stdio: 'inherit' });
    } catch {
      fail('Las verificaciones fallan. Arregla eso antes de publicar.');
    }
    console.log('✓ Verificación en verde\n');
  }

  for (const file of applyVersion(current, version, { dryRun })) {
    console.log(`  ${dryRun ? '(simulado) ' : ''}${file}`);
  }

  if (dryRun) {
    console.log('\n✓ Simulación terminada. No se ha tocado nada.\n');
    return;
  }

  git('add', '--all');
  git('commit', '--message', `chore(release): ${tag}`);
  git('tag', '--annotate', tag, '--message', `Navis ${version}`);
  git('push', '--follow-tags');

  console.log(`\n✓ ${tag} publicada.`);
  console.log('  GitHub Actions está compilando los instaladores de escritorio y el APK.');
  console.log('  Al terminar, el release queda en BORRADOR: revísalo y publícalo desde');
  console.log('  la pestaña Releases del repositorio.\n');
}

// Solo se ejecuta al lanzarlo directamente; al importarlo (tests) se exponen
// nada más las funciones puras.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
