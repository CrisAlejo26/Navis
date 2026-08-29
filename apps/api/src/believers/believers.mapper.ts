import {
  believerName,
  daysWithoutNote,
  needsAttention,
  type Believer as BelieverView,
  type BelieverListItem,
  type BelieverTag as BelieverTagView,
  type Gift as GiftView,
  type IsoDate,
  type MinistryCatalog as MinistryView,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { BelieverGift } from './believer-gift.entity';
import type { Believer } from './believer.entity';
import type { BelieverTag } from './believer-tag.entity';
import type { BelieverTagLink } from './believer-tag-link.entity';
import type { Gift } from './gift.entity';
import type { Ministry } from './ministry.entity';

/**
 * De la entidad a lo que viaja: las labores como lista de textos, que es como
 * las consume la interfaz, y no como filas de una tabla intermedia.
 */
export function toBelieverView(believer: Believer, ministries?: readonly string[]): BelieverView {
  const links = believer.ministries ?? [];

  return {
    id: believer.id,
    churchId: believer.churchId,
    congregationId: believer.congregationId,
    firstName: believer.firstName,
    lastName: believer.lastName,
    phone: believer.phone,
    email: believer.email,
    status: believer.status,
    alertAfterDays: believer.alertAfterDays,
    lastNoteAt: believer.lastNoteAt === null ? null : toIsoDay(believer.lastNoteAt),
    createdAt: believer.createdAt.toISOString(),
    ministries: [...(ministries ?? links.map((one) => one.ministry))],
    // Un booleano y no la clave del fichero: cómo se llama en disco es asunto
    // del servidor, y de fuera solo hace falta saber si hay foto que pedir.
    hasPhoto: believer.photoKey !== null,

    arrivedAt: believer.arrivedAt === null ? null : toIsoDay(believer.arrivedAt),
    arrivalSite: believer.arrivalSite,
    bibleReadings: believer.bibleReadings,
    vivenciasReadings: believer.vivenciasReadings,
    bibleInstituteTimes: believer.bibleInstituteTimes,

    /*
     * Solo salen las que **tienen** fecha: un mapa con veinte nulos ocupa lo
     * mismo que el dato y no dice nada. Y solo se pueblan cuando la consulta
     * trajo las relaciones —en el listado no vienen—, que es justo cuando la
     * ficha las va a pintar.
     */
    ministryDates: datesFrom(
      links,
      (one) => one.ministry,
      (one) => one.startedAt,
    ),
    giftDates: datesFrom(
      believer.gifts ?? [],
      (one) => one.giftId,
      (one) => one.receivedAt,
    ),
  };
}

/** `{ sonido: '2019-05-01' }` a partir de las filas puente que traigan fecha. */
function datesFrom<T>(
  rows: readonly T[],
  key: (row: T) => string,
  date: (row: T) => string | null,
): Record<string, IsoDate> {
  const dates: Record<string, IsoDate> = {};

  for (const row of rows) {
    const value = date(row);
    if (value !== null) dates[key(row)] = toIsoDay(value);
  }

  return dates;
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

export function toBelieverTagView(tag: BelieverTag): BelieverTagView {
  return {
    id: tag.id,
    churchId: tag.churchId,
    name: tag.name,
    accent: tag.accent,
    position: tag.position,
    isSystem: tag.isSystem,
    isActive: tag.isActive,
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
  tags: readonly BelieverTag[];
  featuredTagId: string | null;
  notesCount: number;
  today: IsoDate;
}): BelieverListItem {
  const view = toBelieverView(input.believer, input.ministries);

  return {
    ...view,
    daysWithoutNote: daysWithoutNote(view, input.today),
    needsAttention: needsAttention(view, input.today),
    gifts: input.gifts.map(toGiftView),
    tags: input.tags.map(toBelieverTagView),
    featuredTagId: input.featuredTagId,
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

/**
 * Las etiquetas de cada persona, resueltas contra el catálogo de su iglesia,
 * y **cuál es la destacada** de cada una.
 *
 * Igual que los dones, el catálogo se pide entero una vez en vez de unirlo a
 * cada consulta: la tabla puente no merece un `JOIN`.
 */
export function tagsByBeliever(
  links: readonly BelieverTagLink[],
  catalog: readonly BelieverTag[],
): Map<string, BelieverTag[]> {
  const byId = new Map(catalog.map((tag) => [tag.id, tag]));
  const grouped = new Map<string, BelieverTag[]>();

  for (const link of links) {
    const tag = byId.get(link.tagId);
    if (tag) grouped.set(link.believerId, [...(grouped.get(link.believerId) ?? []), tag]);
  }

  // El `IN (...)` no garantiza orden (CLAUDE.md), y aquí la primera de la lista
  // es lo que sale en la tabla si nadie destaca ninguna: se recompone por la
  // posición del catálogo, que es el orden que se ve en el selector.
  for (const [id, tags] of grouped) {
    grouped.set(
      id,
      [...tags].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
    );
  }

  return grouped;
}

/**
 * La etiqueta que sale en la tabla de cada persona: la única con `featured`.
 * Quien no la tiene marcada sale con `null`, y la interfaz muestra entonces la
 * primera de su lista.
 */
export function featuredByBeliever(links: readonly BelieverTagLink[]): Map<string, string> {
  const featured = new Map<string, string>();

  for (const link of links) {
    if (link.featured) featured.set(link.believerId, link.tagId);
  }

  return featured;
}

/** El nombre compuesto, que es lo que se pinta en la cinta y en la lámina. */
export function fullName(believer: Believer): string {
  return believerName(believer);
}
