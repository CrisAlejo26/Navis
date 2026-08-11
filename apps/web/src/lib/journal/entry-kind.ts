import { ACCENT_PALETTE, ENTRY_KINDS, type EntryKind } from '@navis/shared';
import {
  Compass,
  Eye,
  HandHeart,
  Moon,
  Quote,
  Star,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

interface KindStyle {
  Icon: LucideIcon;
  /** El color del tipo: en la pastilla, el filete de la tarjeta y la barra del gráfico (D2, D15). */
  accent: string;
  labelKey: `journal.kind.${EntryKind}`;
}

/**
 * Cada uno de los siete tipos, con su icono y su color.
 *
 * Los iconos son de lucide y **ninguno se lee como una cruz de lejos** (Regla 7
 * §6). Los colores salen de `ACCENT_PALETTE` —la misma paleta ampliada que
 * sedes, dones y notas de creyentes— y están elegidos separados en el círculo
 * para que los siete se distingan de un vistazo (D2). El color no informa
 * solo: al lado va siempre el tipo escrito (Regla 3 §7).
 */
export const ENTRY_KIND_STYLES: Record<EntryKind, KindStyle> = {
  observacion: { Icon: Eye, accent: ACCENT_PALETTE[1], labelKey: 'journal.kind.observacion' },
  testimonio: { Icon: Quote, accent: ACCENT_PALETTE[5], labelKey: 'journal.kind.testimonio' },
  sueno: { Icon: Moon, accent: ACCENT_PALETTE[13], labelKey: 'journal.kind.sueno' },
  bienHecho: { Icon: Star, accent: ACCENT_PALETTE[4], labelKey: 'journal.kind.bienHecho' },
  correccion: {
    Icon: TriangleAlert,
    accent: ACCENT_PALETTE[8],
    labelKey: 'journal.kind.correccion',
  },
  // El corazón que sostiene: es tan pastoral como un testimonio y hasta ahora
  // no tenía dónde vivir (D2).
  oracion: { Icon: HandHeart, accent: ACCENT_PALETTE[9], labelKey: 'journal.kind.oracion' },
  // La brújula conecta con el vocabulario náutico del proyecto: un rumbo es
  // una decisión (D2).
  decision: { Icon: Compass, accent: ACCENT_PALETTE[14], labelKey: 'journal.kind.decision' },
};

/** En el orden en que se proponen (D2). */
export const ENTRY_KIND_ORDER: readonly EntryKind[] = ENTRY_KINDS;
