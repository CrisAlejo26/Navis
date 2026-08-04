import { z } from 'zod';

/**
 * Los colores con los que se distingue una sede de otra en el calendario.
 *
 * Son **nombres de token** y no hexadecimales (Regla 3): así siguen
 * cumpliendo contraste en claro y en oscuro sin que nadie tenga que elegir dos
 * valores. La lámina que se comparte los traduce a su equivalente de
 * `themeColorsHex`.
 */
export const CONGREGATION_ACCENTS = [
  'primary',
  'accent',
  'success',
  'warning',
  'destructive',
  'brand',
] as const;

export type CongregationAccent = (typeof CONGREGATION_ACCENTS)[number];

export const DEFAULT_CONGREGATION_ACCENT: CongregationAccent = 'primary';

export function isCongregationAccent(value: string): value is CongregationAccent {
  return (CONGREGATION_ACCENTS as readonly string[]).includes(value);
}

/**
 * Una **sede**: un lugar de reunión de la iglesia (RFC 0002 §5.1).
 *
 * No es una iglesia: no tiene cuentas, ni permisos, ni creyentes propios. Es
 * un nombre y un color dentro del espacio de trabajo, y por eso el mismo
 * predicador puede estar el viernes en Elda y el sábado en Alicante sin
 * darlo de alta dos veces.
 */
export const congregationSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  city: z.string().nullable(),
  accent: z.string(),
  /** El orden en que se listan y se pintan. */
  position: z.number().int(),
  /** La que se propone al crear algo. Cada iglesia nace con una. */
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export type Congregation = z.infer<typeof congregationSchema>;

/** Dos campos: se crea desde el propio día que se está programando (§8.4). */
export const createCongregationSchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la sede es obligatorio').max(80),
  city: z.string().trim().max(120).optional(),
  accent: z.enum(CONGREGATION_ACCENTS).optional(),
});

export type CreateCongregationInput = z.infer<typeof createCongregationSchema>;

export const updateCongregationSchema = createCongregationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCongregationInput = z.infer<typeof updateCongregationSchema>;
