import { updateChurchSchema, type UpdateChurchInput } from '@navis/shared';

import { formText } from '@/lib/form';

export type ChurchFormResult =
  { ok: true; data: UpdateChurchInput } | { ok: false; message: string | null };

/**
 * Lo que se escribió en `ChurchFormFields`, ya validado.
 *
 * Va aparte del componente porque un módulo con un componente **solo** exporta
 * componentes (`react-refresh/only-export-components`), y aparte del diálogo
 * porque la página de ajustes envía exactamente lo mismo: si la lectura del
 * formulario viviera en cada llamador, un campo nuevo llegaría desde un lado y
 * desde el otro no.
 *
 * Devuelve el mensaje del esquema y no un booleano: el de zod dice **qué**
 * campo está mal, y el genérico de la interfaz queda para cuando no lo hay.
 */
export function readChurchForm(form: FormData): ChurchFormResult {
  const parsed = updateChurchSchema.safeParse({
    name: formText(form.get('name')),
    city: formText(form.get('city')),
    timezone: formText(form.get('timezone')),
    // Mayúsculas aquí y no en el campo: lo que se escribe se ve como se
    // escribe, y lo que se guarda es siempre el código canónico.
    country: formText(form.get('country'))?.toUpperCase(),
    // La cadena vacía es «sin comunidad», y el esquema la convierte en nula:
    // un `select` no sabe mandar `null` (ver `updateChurchSchema`).
    region: (formText(form.get('region')) ?? '').toUpperCase(),
  });

  if (parsed.success) return { ok: true, data: parsed.data };

  return { ok: false, message: parsed.error.issues[0]?.message ?? null };
}
