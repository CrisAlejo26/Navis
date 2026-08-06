import type { PublicList } from '@navis/shared';

/**
 * **El renglón que se lee debajo del título en WhatsApp** (RFC 0010 D18).
 *
 * Vive aparte de `share-page.ts` porque es lo único de esa página que hay que
 * pensar: el resto son etiquetas. Y porque tiene un cierre que conviene tener a
 * la vista y probado — en una lista restringida **no se cuenta ni una persona**.
 * El número también es un dato, y contarlo en la tarjeta sería contar justo lo
 * que la puerta esconde.
 *
 * El texto va en español, como el resto del documento: el servidor no sabe en
 * qué idioma está quien va a abrir el enlace (Regla 2 §6). Lo que sí se traduce
 * es la vista previa que se le enseña a quien lo reparte, y esa vive en
 * `apps/web/src/lib/lists/share-card.ts`.
 */
export interface ShareDescriptionInput {
  /** Lo que escribió su dueño. Si lo hay, manda: son sus palabras. */
  description: string | null;
  /** Nulo en restringida: ahí no hay ni recuento ni fecha (D18). */
  list: Pick<PublicList, 'members' | 'updatedAt'> | null;
}

export function shareDescription({ description, list }: ShareDescriptionInput): string {
  const propia = description?.trim();
  if (propia) return propia;

  if (!list) return 'Lista compartida con Navis. Hace falta un acceso para verla.';

  return [cuantas(list.members.length), actualizada(list.updatedAt)].filter(Boolean).join(' ');
}

function cuantas(total: number): string {
  if (total === 0) return 'Lista todavía sin nadie, compartida con Navis.';
  if (total === 1) return 'Lista de 1 persona, compartida con Navis.';

  return `Lista de ${total} personas, compartida con Navis.`;
}

/**
 * En UTC a propósito. `updatedAt` es un instante, y el servidor no sabe en qué
 * huso está quien lee la tarjeta: formatearlo con la hora del contenedor haría
 * que la misma lista dijera un día u otro según dónde corra la API. Sin año,
 * que en una tarjeta que se pega en un chat sobra y WhatsApp trunca.
 */
const DIA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });

function actualizada(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  return `Actualizada el ${DIA.format(fecha)}.`;
}
