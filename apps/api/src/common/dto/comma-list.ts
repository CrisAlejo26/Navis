/**
 * `?state=activo&state=nuevo` y también `?state=activo,nuevo`.
 *
 * Los dos son válidos en una URL y la interfaz usa el primero, pero un enlace
 * escrito a mano —o pegado desde otro sitio— suele traer el segundo. Estaba
 * copiado en los tres DTO de listado, así que a la tercera se extrae
 * (Regla 1 §5).
 *
 * Recibe `unknown` y devuelve `unknown` a propósito: `TransformFnParams` de
 * `class-transformer` trae `value` como `any`, y ese `any` se acota **aquí**
 * para que del resto del código salga ya tipado (Regla 10 §6).
 */
export const commaList = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') return value.split(',').filter(Boolean);
  return value;
};
