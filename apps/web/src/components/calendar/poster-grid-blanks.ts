import { weekdayOf } from '@navis/shared';

/**
 * Cuántas celdas en blanco hacen falta antes del primer día para que caiga en
 * su columna de verdad.
 *
 * Semana, dos, tres y cuatro semanas ya piden el tramo desde un lunes
 * (`shareRangeFor`), así que ahí siempre da 0. El mes no: pide del 1 al
 * último tal cual, y si el 1 no cae en lunes, la rejilla —que coloca cada
 * día en orden, sin saber de huecos— los iba corriendo uno a uno hacia
 * columnas de días anteriores. `weekdayOf` da 0 en domingo; la rejilla
 * empieza en lunes, así que se convierte con `(+ 6) % 7`.
 *
 * Aparte de `PosterGrid` porque un componente solo exporta componentes
 * (Regla 6 §…, `react-refresh/only-export-components`).
 */
export function leadingBlanks(firstDay: string | undefined): number {
  if (!firstDay) return 0;
  return (weekdayOf(firstDay) + 6) % 7;
}
