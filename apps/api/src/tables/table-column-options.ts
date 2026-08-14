import { toSlug, type ColumnOption } from '@navis/shared';

interface OptionInput {
  value?: string;
  label: string;
  color?: string;
}

/**
 * Cierra el `value` que falte, único dentro de la columna (RFC 0021 D11).
 *
 * Igual que la `key` de una columna (D7): el `value` es la clave estable con
 * la que queda guardada la opción elegida en el JSON de cada fila. Cuando el
 * cliente ya trae uno —al editar una opción existente— se conserva tal cual,
 * así que renombrar una opción no rompe los datos ya escritos.
 */
export function freeOptionValues(options: readonly OptionInput[]): ColumnOption[] {
  const usados = new Set(
    options.map((one) => one.value).filter((value): value is string => Boolean(value)),
  );
  const resultado: ColumnOption[] = [];

  for (const option of options) {
    const value = option.value ?? freeValue(option.label, usados);
    usados.add(value);
    resultado.push({
      value,
      label: option.label,
      ...(option.color ? { color: option.color } : {}),
    });
  }

  return resultado;
}

function freeValue(label: string, usados: ReadonlySet<string>): string {
  const base = toSlug(label, 60) || 'opcion';

  for (let intento = 1; ; intento += 1) {
    const value = intento === 1 ? base : `${base}-${String(intento)}`;
    if (!usados.has(value)) return value;
  }
}
