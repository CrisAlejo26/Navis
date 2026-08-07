import { serialToDay, type Sheet } from './xlsx-read';

/**
 * Lo que sale del formulario de altas de la iglesia, ya cruzado.
 *
 * El libro trae **dos hojas y la misma gente en las dos**: en «FASE 1» están el
 * teléfono y el correo, y en «FASE 2» la trayectoria. Cruzarlas cuesta, y esto
 * es lo que se probó contra el fichero de verdad:
 *
 * - **Por nombre exacto**: falla en doce de treinta y nueve. Están escritos
 *   distinto en cada hoja: «Luis Eduardo Bedoya urrea» y «Luis Eduardo Urrea
 *   Bedoya», «Alzate» y «Alazate», «Michel» y «Michele».
 * - **Por número de documento**: falla igual. La FASE 1 trae la **cédula
 *   colombiana** y la FASE 2 el **NIE español** de la misma persona, que son
 *   dos números distintos.
 * - **Por palabras del nombre**, que es lo que hace esto: casan treinta y ocho.
 *   Se comparan los tokens sin acentos ni orden, hacen falta **dos en común** y
 *   **no puede haber empate**; si lo hay, no se casa nadie con nadie, porque
 *   colgarle el contacto de otro a alguien es peor que dejarlo vacío.
 *
 * Quien se quede sin pareja sale en `unmatched` para que el importador lo diga.
 */
export interface SheetPerson {
  row: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  arrivedAt: string | null;
  arrivalSite: string | null;
  bibleReadings: number | null;
  vivenciasReadings: number | null;
  bibleInstituteTimes: number | null;
  /** Por **nombre** del don, que es lo que hay en la hoja. */
  giftDates: Record<string, string>;
  /** Por `slug` de labor. Una labor sin fecha también cuenta: el valor es null. */
  ministries: Record<string, string | null>;
}

/** Las columnas de «Inicio labor …» y el slug del catálogo al que van. */
const LABOR_COLUMNS: Readonly<Record<string, string>> = {
  S: 'sonido',
  T: 'biblias',
  U: 'vigilancia',
  V: 'ofrenda',
  W: 'microfono',
};

/** Las tres columnas de fecha de don, por el nombre exacto del catálogo. */
const GIFT_COLUMNS: Readonly<Record<string, string>> = {
  J: 'Bautismo con el Espíritu Santo',
  K: 'Imposición de manos',
  M: 'Profecía',
};

/** Lo que se escribe suelto en «Labores materiales que realiza» (columna R). */
const LABOR_WORDS: Readonly<Record<string, string>> = {
  sonido: 'sonido',
  biblias: 'biblias',
  biblia: 'biblias',
  vigilancia: 'vigilancia',
  ofrenda: 'ofrenda',
  microfono: 'microfono',
  recepcion: 'recepcion',
};

const normalize = (value: string | undefined): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Las palabras del nombre que sirven para casar.
 *
 * Se van las de dos letras o menos: «de», «la», «y» están en medio mundo y solo
 * añaden coincidencias falsas.
 */
const tokensOf = (value: string | undefined): Set<string> =>
  new Set(
    normalize(value)
      .split(' ')
      .filter((one) => one.length > 2),
  );

const count = (value: string | undefined): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
};

export interface SheetReading {
  people: SheetPerson[];
  /** Nombres de FASE 2 a los que no se les encontró teléfono en FASE 1. */
  unmatched: string[];
}

export function readPeople(sheets: Map<string, Sheet>): SheetReading {
  const fase1 = pick(sheets, 'FASE 1');
  const fase2 = pick(sheets, 'FASE 2');

  const contacts: Contact[] = [];
  for (const [line, row] of fase1) {
    if (line === 1 || !row.A) continue;
    const phone = row.D?.trim() || null;
    const email = row.E?.trim().toLowerCase() || null;
    if (!phone && !email) continue;
    contacts.push({ tokens: tokensOf(row.A), phone, email });
  }

  const people: SheetPerson[] = [];
  const unmatched: string[] = [];

  for (const [line, row] of fase2) {
    if (line === 1 || !row.B) continue;

    const fullName = row.B.replace(/\s+/g, ' ').trim();
    const contact = contactFor(fullName, contacts);
    if (!contact) unmatched.push(fullName);

    people.push({
      row: line,
      fullName,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      arrivedAt: serialToDay(row.H),
      arrivalSite: row.I?.trim() || null,
      bibleReadings: count(row.O),
      vivenciasReadings: count(row.P),
      bibleInstituteTimes: count(row.Q),
      giftDates: dates(row, GIFT_COLUMNS),
      ministries: ministriesOf(row),
    });
  }

  return { people, unmatched };
}

/** Una fila de FASE 1: sus palabras y lo que trae, si trae algo. */
interface Contact {
  tokens: Set<string>;
  phone: string | null;
  email: string | null;
}

/** El contacto de quien más palabras del nombre comparta, si gana con claridad. */
function contactFor(fullName: string, contacts: readonly Contact[]): Contact | null {
  const mine = tokensOf(fullName);

  let best: { contact: Contact; common: number } | null = null;
  let tied = false;

  for (const contact of contacts) {
    let common = 0;
    for (const token of mine) if (contact.tokens.has(token)) common++;
    if (common < 2) continue;

    if (!best || common > best.common) {
      best = { contact, common };
      tied = false;
    } else if (common === best.common) {
      tied = true;
    }
  }

  return best && !tied ? best.contact : null;
}

function pick(sheets: Map<string, Sheet>, name: string): Sheet {
  for (const [key, sheet] of sheets) {
    if (normalize(key) === normalize(name)) return sheet;
  }

  throw new Error(`El libro no tiene la hoja «${name}»`);
}

function dates(
  row: Record<string, string>,
  columns: Readonly<Record<string, string>>,
): Record<string, string> {
  const found: Record<string, string> = {};

  for (const [column, key] of Object.entries(columns)) {
    const day = serialToDay(row[column]);
    if (day) found[key] = day;
  }

  return found;
}

/**
 * Las labores de una persona: las que tienen fecha de inicio, más las que
 * escribió sueltas en la columna de texto —«Micrófono, vigilancia»—, que son
 * las que hace sin recordar desde cuándo.
 */
function ministriesOf(row: Record<string, string>): Record<string, string | null> {
  const found: Record<string, string | null> = {};

  for (const [column, slug] of Object.entries(LABOR_COLUMNS)) {
    const day = serialToDay(row[column]);
    if (day) found[slug] = day;
  }

  for (const word of normalize(row.R).split(/[,;/]| y /)) {
    const slug = LABOR_WORDS[word.trim()];
    if (slug && !(slug in found)) found[slug] = null;
  }

  return found;
}
