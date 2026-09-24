import type { NoteKind } from '@navis/shared';

import type { IoniconName } from '@/lib/nav-mobile';

/**
 * El icono de cada tipo de nota, junto a su nombre en la pastilla de la
 * tarjeta. Son los mismos que propone el formulario (`note-form-sheet`), que
 * desde aquí los importa: una sola fuente para los dos.
 */
export const NOTE_KIND_ICONS: Record<NoteKind, IoniconName> = {
    seguimiento: 'chatbubble-outline',
    testimonio: 'chatbox-outline',
    sueno: 'moon-outline',
    vision: 'eye-outline',
    experiencia: 'flame-outline',
    don: 'sparkles-outline',
    correccion: 'alert-circle-outline',
};
