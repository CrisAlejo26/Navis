/**
 * Un día de calendario (`AAAA-MM-DD`) al número de serie de Excel.
 *
 * Va como **número y no como texto** (RFC 0009 D10) para que la columna se
 * pueda ordenar, filtrar por rango y restar. El formato con el que se pinta es
 * el `numFmtId` 14, el corto integrado, que Excel dibuja con la configuración
 * regional de quien abre el fichero: escribir `dd/mm/yyyy` a mano dejaría el
 * fichero en español para siempre.
 *
 * El origen es el **30 de diciembre de 1899** y no el 1 de enero de 1900: Excel
 * se cree que 1900 fue bisiesto y arrastra un día de más desde entonces.
 * Restar desde el 30 lo compensa para todo lo posterior al 1 de marzo de 1900,
 * que es cualquier fecha que vaya a salir de aquí.
 */
const ORIGEN = Date.UTC(1899, 11, 30);
const MS_POR_DIA = 86_400_000;

export function toExcelSerial(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;

  const [, year = '', month = '', day = ''] = match;
  // En UTC y a mano: `new Date('2026-03-14')` es medianoche UTC y `new
  // Date(2026, 2, 14)` es medianoche local, y esa diferencia se ha comido ya
  // un día en este proyecto más de una vez (CLAUDE.md).
  const instante = Date.UTC(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(instante)) return null;

  return Math.round((instante - ORIGEN) / MS_POR_DIA);
}
