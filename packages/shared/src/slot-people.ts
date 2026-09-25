import type { MeetingSlot } from './schemas/calendar';

/** El subconjunto de `Intl.ListFormat` que se usa, por si el motor no lo trae. */
interface ListFormatLike {
    format(list: readonly string[]): string;
}

type ListFormatConstructor = new (
    locale: string | undefined,
    options: { style: 'long' | 'short' | 'narrow'; type: 'conjunction' },
) => ListFormatLike;

/**
 * «Ana, Pedro y Luis», con la conjunción del idioma activo.
 *
 * Hermes (el motor de la app móvil) puede no traer `Intl.ListFormat`: en ese
 * caso los nombres van separados por comas, que se lee bien igualmente.
 */
export function joinNames(names: readonly string[], locale?: string): string {
    const ListFormat = (Intl as { ListFormat?: ListFormatConstructor }).ListFormat;
    if (names.length < 2 || !ListFormat) return names.join(', ');

    return new ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
}

/** Los nombres de quien ocupa la fase, en su orden, o `fallback` si está libre. */
export function slotNames(
    slot: Pick<MeetingSlot, 'believers'>,
    locale: string | undefined,
    fallback: string,
): string {
    return slot.believers.length > 0
        ? joinNames(
              slot.believers.map((one) => one.name),
              locale,
          )
        : fallback;
}

/** Si nadie ocupa la fase. */
export function isSlotEmpty(slot: Pick<MeetingSlot, 'believers'>): boolean {
    return slot.believers.length === 0;
}
