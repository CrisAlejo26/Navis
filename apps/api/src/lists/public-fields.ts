import {
  DEFAULT_PUBLIC_FIELDS,
  listPublicFieldsSchema,
  type ListPublicFields,
} from '@navis/shared';

/**
 * Qué campos opcionales salen en público, guardados como JSON en una columna de
 * texto —igual que los permisos de un rol— porque nunca se consulta por dentro.
 *
 * Se lee con el esquema, no con un `as`: lo que hay en la columna lo escribió
 * una versión anterior del programa y puede no tener la forma de hoy (Regla 10).
 * Lo que no case cae al valor por defecto, que es **el más restrictivo**.
 */
export function parsePublicFields(raw: string): ListPublicFields {
  let value: unknown;
  try {
    value = JSON.parse(raw || '{}');
  } catch {
    return { ...DEFAULT_PUBLIC_FIELDS };
  }

  const parsed = listPublicFieldsSchema.safeParse(value);
  return parsed.success ? parsed.data : { ...DEFAULT_PUBLIC_FIELDS };
}

export function serializePublicFields(fields: ListPublicFields): string {
  return JSON.stringify(fields);
}
