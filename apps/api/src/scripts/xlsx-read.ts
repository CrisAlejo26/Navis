import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Una hoja: por número de fila, las celdas con valor por letra de columna. */
export type Sheet = Map<number, Record<string, string>>;

/**
 * Leer un `.xlsx` **sin librería**, como ya se escribe uno en
 * `apps/web/src/lib/export/xlsx/`.
 *
 * Un `.xlsx` es un ZIP de XML: se descomprime con el `unzip` del sistema —está
 * en la imagen de la API y en cualquier Linux— y se sacan a mano las tres cosas
 * que hacen falta: los nombres de las hojas, la tabla de cadenas compartidas y
 * las celdas. No hay nada más que interpretar para un listado plano.
 *
 * Lo que **no** hace, a propósito: fórmulas, formatos y fechas. Una celda de
 * fecha vuelve como el número de serie que es, y convertirlo es de quien sabe
 * qué columna es una fecha (ver `serialToDay`).
 */
export function readWorkbook(path: string): Map<string, Sheet> {
  const dir = mkdtempSync(join(tmpdir(), 'navis-xlsx-'));

  try {
    execFileSync('unzip', ['-o', '-q', path, '-d', dir], { stdio: 'pipe' });

    const shared = readSharedStrings(dir);
    const sheets = new Map<string, Sheet>();

    for (const { name, file } of sheetFiles(dir)) {
      sheets.set(name, readSheet(join(dir, 'xl', file), shared));
    }

    return sheets;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Excel cuenta los días desde el **30 de diciembre de 1899**, no desde el 1 de
 * enero de 1900: se cree que 1900 fue bisiesto. Es la misma constante que usa
 * el escritor de `.xlsx` de la web, y por el mismo motivo.
 */
export function serialToDay(value: string | undefined): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return null;

  const ms = Math.round(n) * 86_400_000 + Date.UTC(1899, 11, 30);

  return new Date(ms).toISOString().slice(0, 10);
}

function decode(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function readSharedStrings(dir: string): string[] {
  // Un libro cuyas celdas sean todas números o texto en línea no lleva esta
  // parte, y no tenerla no es un error.
  const xml = maybeRead(join(dir, 'xl/sharedStrings.xml'));
  if (xml === null) return [];

  // Un `<si>` puede venir partido en varios `<t>` cuando lleva formato dentro.
  return xml
    .split('<si>')
    .slice(1)
    .map((si) => decode([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join('')));
}

function maybeRead(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function sheetFiles(dir: string): { name: string; file: string }[] {
  const wb = readFileSync(join(dir, 'xl/workbook.xml'), 'utf8');
  const rels = readFileSync(join(dir, 'xl/_rels/workbook.xml.rels'), 'utf8');

  const target = new Map(
    [...rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );

  return [...wb.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="(rId\d+)"/g)].flatMap((m) => {
    const file = target.get(m[2]);
    return file ? [{ name: decode(m[1]), file: file.replace(/^\/?xl\//, '') }] : [];
  });
}

function readSheet(path: string, shared: readonly string[]): Sheet {
  const xml = readFileSync(path, 'utf8');
  const rows: Sheet = new Map();

  for (const row of xml.split('<row').slice(1)) {
    for (const cell of row.split('<c ').slice(1)) {
      const ref = /r="([A-Z]+\d+)"/.exec(cell)?.[1];
      if (!ref) continue;

      const value = cellValue(cell, shared);
      if (value === null || value === '') continue;

      const line = Number(ref.replace(/\D/g, ''));
      const column = ref.replace(/\d/g, '');
      rows.set(line, { ...rows.get(line), [column]: value });
    }
  }

  return rows;
}

function cellValue(cell: string, shared: readonly string[]): string | null {
  const type = /t="([^"]*)"/.exec(cell)?.[1];

  if (type === 'inlineStr') {
    return decode([...cell.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));
  }

  const raw = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1];
  if (raw === undefined) return null;

  return type === 's' ? (shared[Number(raw)] ?? null) : decode(raw);
}
