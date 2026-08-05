import { ACCENT_PALETTE, NOTE_KINDS, type NoteKind } from '@navis/shared';
import {
  Eye,
  Flame,
  MessageCircle,
  Moon,
  Quote,
  Sprout,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

interface KindStyle {
  Icon: LucideIcon;
  /** El filete del color del tipo, en la bitácora (§7.5). */
  accent: string;
  labelKey: `notes.kinds.${NoteKind}`;
}

/**
 * Cada tipo de nota con su icono y su color.
 *
 * Los iconos son de lucide y **ninguno se lee como una cruz de lejos** (Regla 7
 * §6). El del don es un brote: un don que aparece es crecimiento, no un paquete
 * con lazo.
 *
 * Los colores salen de `ACCENT_PALETTE` —la misma paleta de sedes y dones— y
 * están escogidos separados en el círculo para que seis filetes seguidos se
 * distingan de un vistazo. El color no informa solo: al lado va siempre el tipo
 * escrito en versalitas.
 */
export const NOTE_STYLES: Record<NoteKind, KindStyle> = {
  seguimiento: {
    Icon: MessageCircle,
    accent: ACCENT_PALETTE[1],
    labelKey: 'notes.kinds.seguimiento',
  },
  testimonio: { Icon: Quote, accent: ACCENT_PALETTE[10], labelKey: 'notes.kinds.testimonio' },
  sueno: { Icon: Moon, accent: ACCENT_PALETTE[13], labelKey: 'notes.kinds.sueno' },
  vision: { Icon: Eye, accent: ACCENT_PALETTE[3], labelKey: 'notes.kinds.vision' },
  experiencia: { Icon: Flame, accent: ACCENT_PALETTE[7], labelKey: 'notes.kinds.experiencia' },
  don: { Icon: Sprout, accent: ACCENT_PALETTE[4], labelKey: 'notes.kinds.don' },
  // El rojo de la paleta, que aquí no es una alarma: es lo que hace que una
  // corrección se distinga sin leer entre diez años de seguimientos.
  correccion: {
    Icon: TriangleAlert,
    accent: ACCENT_PALETTE[8],
    labelKey: 'notes.kinds.correccion',
  },
};

/** En el orden en que se proponen: lo más frecuente primero. */
export const NOTE_ORDER: readonly NoteKind[] = NOTE_KINDS;
