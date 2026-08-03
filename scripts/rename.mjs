#!/usr/bin/env node
/**
 * Renombra el proyecto entero.
 *
 *   pnpm rename Navis              cambia el nombre en todo el código
 *   pnpm rename Navis --dry-run    enseña qué tocaría, sin escribir nada
 *
 * Cambia, a la vez y de forma consistente:
 *   · el nombre visible          Navis → Navis
 *   · el slug                    navis → navis
 *   · el scope de los paquetes   @navis/* → @navis/*
 *   · el identificador nativo    org.navis.app → org.navis.app
 *   · el esquema de enlaces      navis:// → navis://
 *   · el crate de Rust, las claves de almacenamiento, el proyecto de compose,
 *     el usuario y la base de datos de Postgres…
 *
 * Lo que NO puede hacer solo, y te recuerda al terminar: renombrar la carpeta
 * del proyecto, el repositorio en GitHub, el dominio y la carpeta del servidor.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rutaMarca = join(root, 'brand.json');
const rutaMarcasAnteriores = join(root, 'docker', 'marcas-anteriores.txt');

/** Ficheros que no son texto: se saltan enteros. */
const BINARIOS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.icns',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.keystore',
  '.jks',
  '.pdf',
  '.zip',
  // Bases de datos locales: se renombran por nombre, jamás por contenido.
  '.sqlite',
  '.sqlite-shm',
  '.sqlite-wal',
  '.db',
]);

/**
 * Ficheros que git no ve (están en .gitignore) pero que también llevan la
 * marca. Sin esto, tras un renombrado el `.env` seguía apuntando a
 * `data/<marcavieja>.sqlite` y la base de datos local quedaba con el nombre
 * antiguo para siempre.
 */
const FUERA_DE_GIT = ['.env', '.env.local', '.env.production', '.env.test'];

/**
 * Ficheros que NO se sustituyen: su contenido son precisamente los nombres
 * viejos, y reescribirlos borraría el historial que documentan.
 */
const INTOCABLES = new Set(['docker/marcas-anteriores.txt']);

const escapar = (texto) => texto.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/**
 * Deriva de un nombre visible el resto de formas que hacen falta.
 * «Navis» → slug `navis`, scope `@navis`, dominio inverso `org.navis`.
 */
export function derivarMarca(nombre, anterior) {
  const slug = nombre
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

  if (!slug) throw new Error(`«${nombre}» no deja ningún slug utilizable.`);

  // El dominio inverso conserva su prefijo (org, com, es…) y cambia el resto.
  const prefijo = anterior.dominioInverso.split('.')[0];

  return {
    nombre,
    slug,
    scope: `@${slug}`,
    dominioInverso: `${prefijo}.${slug}`,
    esquema: slug,
  };
}

/**
 * Sustituciones a aplicar, de la más específica a la más general: si el slug
 * fuese antes, se comería trozos del nombre visible y del scope.
 */
export function sustituciones(antes, despues) {
  return [
    [antes.dominioInverso, despues.dominioInverso],
    [antes.scope, despues.scope],
    [antes.nombre, despues.nombre],
    [antes.nombre.toUpperCase(), despues.nombre.toUpperCase()],
    [antes.slug, despues.slug],
    [antes.slug.toUpperCase(), despues.slug.toUpperCase()],
  ].filter(([de, a]) => de !== a);
}

export function aplicar(texto, cambios) {
  let salida = texto;
  for (const [de, a] of cambios) salida = salida.replaceAll(new RegExp(escapar(de), 'g'), a);
  return salida;
}

/** Rutas del repositorio cuyo nombre contiene alguna de las formas a sustituir. */
export function renombrables(cambios, rutas) {
  const lista = rutas ?? todosLosFicheros();
  return lista.filter((ruta) => cambios.some(([de]) => ruta.includes(de)));
}

/**
 * Añade el slug que se abandona a la lista de marcas anteriores, sin
 * duplicados y sin la marca actual. `scripts/limpiar-docker.sh` la usa para
 * saber qué imágenes del servidor son basura de un renombrado.
 */
export function registrarMarcaAnterior(contenido, slugAnterior, slugActual) {
  const previas = contenido
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea && !linea.startsWith('#'));

  const lista = [...new Set([...previas, slugAnterior])].filter((slug) => slug !== slugActual);
  return `${lista.join('\n')}\n`;
}

/** Ficheros ignorados por git que aun así llevan la marca. */
function ficherosFueraDeGit() {
  const sueltos = FUERA_DE_GIT.filter((ruta) => existsSync(join(root, ruta)));

  // Todo lo que haya en data/: son las bases de datos locales de desarrollo.
  const datos = existsSync(join(root, 'data'))
    ? readdirSync(join(root, 'data')).map((nombre) => `data/${nombre}`)
    : [];

  return [...sueltos, ...datos];
}

function todosLosFicheros() {
  return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean);
}

function ficherosDelRepositorio() {
  const salida = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  return salida
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .filter((ruta) => !BINARIOS.has(extname(ruta).toLowerCase()))
    .filter((ruta) => !INTOCABLES.has(ruta));
}

function main(argv) {
  const dryRun = argv.includes('--dry-run');
  const nombre = argv.find((arg) => !arg.startsWith('--'));

  if (!nombre) {
    console.error('\n✖ Falta el nombre nuevo. Ejemplo: pnpm rename Navis\n');
    process.exit(1);
  }

  const antes = JSON.parse(readFileSync(rutaMarca, 'utf8'));
  const despues = derivarMarca(nombre, antes);
  const cambios = sustituciones(antes, despues);

  if (cambios.length === 0) {
    console.log(`\n✓ El proyecto ya se llama ${nombre}. No hay nada que hacer.\n`);
    return;
  }

  console.log(`\n🏷  ${antes.nombre} → ${despues.nombre}\n`);
  for (const [de, a] of cambios) console.log(`   ${de}  →  ${a}`);
  console.log('');

  let tocados = 0;
  let ocurrencias = 0;

  const textos = [
    ...ficherosDelRepositorio(),
    ...ficherosFueraDeGit().filter((ruta) => !BINARIOS.has(extname(ruta).toLowerCase())),
  ];

  for (const ruta of textos) {
    const destino = join(root, ruta);
    let original;
    try {
      original = readFileSync(destino, 'utf8');
    } catch {
      continue; // borrado o ilegible: no es asunto de este script
    }

    const nuevo = aplicar(original, cambios);
    if (nuevo === original) continue;

    const cuantas = cambios.reduce(
      (total, [de]) => total + (original.match(new RegExp(escapar(de), 'g')) ?? []).length,
      0,
    );
    ocurrencias += cuantas;
    tocados++;

    console.log(`  ${dryRun ? '(simulado) ' : ''}${ruta} — ${String(cuantas)}`);
    if (!dryRun) writeFileSync(destino, nuevo);
  }

  // Ficheros cuyo NOMBRE lleva la marca (p. ej. el vhost de nginx). Se mueven
  // con `git mv` para no perder el historial. Sin esto quedaban con el nombre
  // viejo y el contenido nuevo, que es peor que no cambiar nada.
  for (const ruta of renombrables(cambios)) {
    const nueva = aplicar(ruta, cambios);
    console.log(`  ${dryRun ? '(simulado) ' : ''}${ruta} → ${nueva}`);
    if (!dryRun) git('mv', ruta, nueva);
  }

  // Lo mismo para lo que git no ve: la base de datos local se llamaba
  // `data/<marcavieja>.sqlite` y hay que moverla, no reescribirla.
  for (const ruta of renombrables(cambios, ficherosFueraDeGit())) {
    const nueva = aplicar(ruta, cambios);
    console.log(`  ${dryRun ? '(simulado) ' : ''}${ruta} → ${nueva}  (fuera de git)`);
    if (!dryRun) renameSync(join(root, ruta), join(root, nueva));
  }

  // brand.json es la fuente de la verdad: se reescribe entero, conservando el
  // comentario de cabecera.
  if (!dryRun) {
    const marca = JSON.parse(readFileSync(rutaMarca, 'utf8'));
    writeFileSync(rutaMarca, `${JSON.stringify({ ...marca, ...despues }, null, 2)}\n`);

    // Y se apunta el slug abandonado, para poder limpiar sus imágenes.
    const previas = existsSync(rutaMarcasAnteriores)
      ? readFileSync(rutaMarcasAnteriores, 'utf8')
      : '';
    writeFileSync(rutaMarcasAnteriores, registrarMarcaAnterior(previas, antes.slug, despues.slug));
  }

  console.log(
    `\n${dryRun ? 'Se tocarían' : 'Tocados'} ${String(tocados)} ficheros, ${String(ocurrencias)} apariciones.`,
  );

  if (dryRun) {
    console.log('\n✓ Simulación terminada. No se ha escrito nada.\n');
    return;
  }

  console.log(`
Queda por hacer a mano (el script no puede, o no debe, hacerlo solo):

  1. La carpeta del proyecto:
       cd .. && mv ${antes.nombre} ${despues.nombre}
  2. El repositorio en GitHub (Settings → Repository name) y después:
       git remote set-url origin <la nueva URL>
  3. Reinstalar, SIEMPRE:
       CI=true pnpm install
     Cambian los nombres de los paquetes y, si además has movido la carpeta,
     los enlaces del workspace en node_modules apuntan a la ruta vieja: hasta
     reinstalar, cualquier «pnpm lint» fallará con «Cannot find package».
  4. En el servidor: la carpeta de despliegue, el dominio y el certificado.
     La base de datos NO se renombra sola; si quieres cambiar el usuario y el
     nombre de la base, hay que migrar los datos aparte.
  5. Comprobarlo todo:
       pnpm check
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
