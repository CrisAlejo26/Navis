import { BadRequestException } from '@nestjs/common';

/** El valor de un filtro `between` numérico: `{ min?, max? }`. */
export function asNumericRange(value: unknown): { min?: number; max?: number } {
  if (!value || typeof value !== 'object') return {};
  const min = 'min' in value && typeof value.min === 'number' ? value.min : undefined;
  const max = 'max' in value && typeof value.max === 'number' ? value.max : undefined;
  return { min, max };
}

/** El valor de un filtro `between` de fecha: `{ from?, to? }`, ya en `AAAA-MM-DD`. */
export function asDateRange(value: unknown): { from?: string; to?: string } {
  if (!value || typeof value !== 'object') return {};
  const from =
    'from' in value && typeof value.from === 'string' ? value.from.slice(0, 10) : undefined;
  const to = 'to' in value && typeof value.to === 'string' ? value.to.slice(0, 10) : undefined;
  return { from, to };
}

/** El valor de un filtro `in`: una lista de opciones elegidas. */
export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Ese filtro necesita una lista de valores');
  }
  return value.filter((one): one is string => typeof one === 'string');
}
