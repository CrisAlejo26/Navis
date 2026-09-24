import { ACCENT_PALETTE } from './schemas/congregations';
import type { NoteKind } from './schemas/believer-notes';

/**
 * El color de cada tipo de nota (RFC 0003 §7.5).
 *
 * Sale de `ACCENT_PALETTE` —la misma paleta de sedes y dones— y está escogido
 * separado en el círculo para que seis filetes seguidos se distingan de un
 * vistazo. El color nunca informa solo: al lado va siempre el tipo escrito.
 * La corrección lleva el rojo de la paleta, que aquí no es una alarma: es lo
 * que hace que se distinga sin leer entre diez años de seguimientos.
 *
 * Vive en `shared` y no en la web para que el móvil pinte la misma bitácora
 * con los mismos colores (Regla 1).
 */
export const NOTE_KIND_ACCENTS: Record<NoteKind, string> = {
    seguimiento: ACCENT_PALETTE[1],
    testimonio: ACCENT_PALETTE[10],
    sueno: ACCENT_PALETTE[13],
    vision: ACCENT_PALETTE[3],
    experiencia: ACCENT_PALETTE[7],
    don: ACCENT_PALETTE[4],
    correccion: ACCENT_PALETTE[8],
};
