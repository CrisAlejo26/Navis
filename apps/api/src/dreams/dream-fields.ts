import { BadRequestException } from '@nestjs/common';
import { toSearchName } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';

/** Lo que se guarda en `search_text`: lo que se puede buscar, normalizado (§6.1). */
export function toSearchText(
  title: string | null,
  body: string,
  interpretation: string | null,
): string {
  // La misma normalización que `search_name` de creyentes y que la de
  // profecías: si divergieran, una de las búsquedas dejaría de encontrar
  // acentos.
  return toSearchName([title, body, interpretation].filter(Boolean).join(' '));
}

/**
 * Un campo opcional vacío es «no hay», no una cadena en blanco guardada.
 *
 * Importa más de lo que parece: el estado se deriva de si hay interpretación
 * (D8), así que un `''` guardado dejaría el sueño «en estudio» sin que nadie
 * hubiera escrito nada.
 */
export function blankToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** No se puede haber cumplido antes de soñarse (D12). */
export function ensureOrder(dreamedAt: string, fulfilledAt: string | null): void {
  if (fulfilledAt && toIsoDay(fulfilledAt) < dreamedAt) {
    throw new BadRequestException('No puede haberse cumplido antes de soñarse');
  }
}
