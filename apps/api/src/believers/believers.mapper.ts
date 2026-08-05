import {
  believerName,
  daysWithoutNote,
  needsAttention,
  type Believer as BelieverView,
  type BelieverListItem,
  type Gift as GiftView,
  type IsoDate,
  type MinistryCatalog as MinistryView,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { BelieverGift } from './believer-gift.entity';
import type { Believer } from './believer.entity';
import type { Gift } from './gift.entity';
import type { Ministry } from './ministry.entity';

/**
 * De la entidad a lo que viaja: las labores como lista de textos, que es como
 * las consume la interfaz, y no como filas de una tabla intermedia.
 */
export function toBelieverView(believer: Believer, ministries?: readonly string[]): BelieverView {
  return {
    id: believer.id,
    churchId: believer.churchId,
    congregationId: believer.congregationId,
    firstName: believer.firstName,
    lastName: believer.lastName,
    phone: believer.phone,
    status: believer.status,
    alertAfterDays: believer.alertAfterDays,
    lastNoteAt: believer.lastNoteAt === null ? null : toIsoDay(believer.lastNoteAt),
    createdAt: believer.createdAt.toISOString(),
    ministries: [...(ministries ?? (believer.ministries ?? []).map((one) => one.ministry))],
    // Un booleano y no la clave del fichero: cómo se llama en disco es asunto
    // del servidor, y de fuera solo hace falta saber si hay foto que pedir.
    hasPhoto: believer.photoKey !== null,
  };
}

export function toGiftView(gift: Gift): GiftView {
  return {
    id: gift.id,
    churchId: gift.churchId,
    name: gift.name,
    accent: gift.accent,
    position: gift.position,
    isSystem: gift.isSystem,
    isActive: gift.isActive,
  };
}

/** La labor del catálogo. Lleva el `slug`, que es lo que guarda la persona. */
export function toMinistryView(ministry: Ministry): MinistryView {
  return {
    id: ministry.id,
    churchId: ministry.churchId,
    slug: ministry.slug,
    name: ministry.name,
    accent: ministry.accent,
    position: ministry.position,
    isSystem: ministry.isSystem,
    isActive: ministry.isActive,
  };
}

/**
 * La fila del listado, con el aviso ya calculado (§6.1).
 *
 * Se calcula aquí y no en la interfaz porque el filtro «piden atención» y el
 * resumen lo resuelven en SQL: si la fila dijera otra cosa que el filtro, la
 * pantalla enseñaría a alguien que ella misma ha dejado fuera.
 */
export function toListItem(input: {
  believer: Believer;
  ministries: readonly string[];
  gifts: readonly Gift[];
  notesCount: number;
  today: IsoDate;
}): BelieverListItem {
  const view = toBelieverView(input.believer, input.ministries);

  return {
    ...view,
    daysWithoutNote: daysWithoutNote(view, input.today),
    needsAttention: needsAttention(view, input.today),
    gifts: input.gifts.map(toGiftView),
    notesCount: input.notesCount,
  };
}

/**
 * Los dones de cada persona, resueltos contra el catálogo de su iglesia.
 *
 * El catálogo se pide entero una vez —son diez filas— en vez de unirlo a cada
 * consulta: una tabla puente con veinte enlaces no merece un `JOIN`.
 */
export function giftsByBeliever(
  links: readonly BelieverGift[],
  catalog: readonly Gift[],
): Map<string, Gift[]> {
  const byId = new Map(catalog.map((gift) => [gift.id, gift]));
  const grouped = new Map<string, Gift[]>();

  for (const link of links) {
    const gift = byId.get(link.giftId);
    if (gift) grouped.set(link.believerId, [...(grouped.get(link.believerId) ?? []), gift]);
  }

  return grouped;
}

/** El nombre compuesto, que es lo que se pinta en la cinta y en la lámina. */
export function fullName(believer: Believer): string {
  return believerName(believer);
}
