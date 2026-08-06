import type { IsoDate } from '@navis/shared';

/**
 * El puente entre `<input type="month">` y lo que se guarda (RFC 0012).
 *
 * El campo del navegador habla en `AAAA-MM` y la columna es una fecha, así que
 * se guarda con el **día 1**. Es una convención, no una pérdida: nadie recuerda
 * el día en que empezó con el sonido, y guardar «hoy» o el día del formulario
 * sería inventarse una precisión que el dato no tiene.
 */
export function monthToDay(month: string): IsoDate | null {
  return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : null;
}

export function dayToMonth(day: string | null | undefined): string {
  return day ? day.slice(0, 7) : '';
}
