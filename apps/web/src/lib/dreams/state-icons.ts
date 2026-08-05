import type { DreamState } from '@navis/shared';
import { Compass, MoonStar, Sunrise, type LucideIcon } from 'lucide-react';

/**
 * El icono de cada estado (RFC 0005 §7.5).
 *
 * No es adorno: es lo que hace que el estado se distinga **sin depender del
 * color** (Regla 3 §7), y por eso lo comparten la pastilla y los filtros.
 * Ninguno de los tres se lee como una cruz de lejos (Regla 7 §6), y los tres
 * son de la noche o del amanecer, que es de lo que va esto.
 *
 * En su propio fichero y no junto al componente: mezclarlos rompe el recambio
 * en caliente de Vite, que quiere módulos que solo exporten componentes.
 */
export const STATE_ICON: Record<DreamState, LucideIcon> = {
  /** Una luna: está escrito y ahí se queda. */
  apuntado: MoonStar,
  /** Una brújula: se le está buscando el sentido. */
  estudio: Compass,
  /** El amanecer: pasó. */
  cumplido: Sunrise,
};

/** El color de cada estado, del token que le toca. */
export const STATE_TONE: Record<DreamState, string> = {
  apuntado: 'text-muted-foreground',
  estudio: 'text-primary',
  cumplido: 'text-success',
};

/**
 * Cuánto se tiñe una celda de la franja según lo que se soñó esa noche (D19).
 *
 * Cuatro escalones y no una opacidad calculada: con un valor continuo, dos y
 * tres sueños se ven igual, y el salto es justo la información. Nada por debajo
 * de un tinte que se vea (§7.1.3).
 */
export const NIGHT_TONE = ['bg-muted', 'bg-primary/45', 'bg-primary/70', 'bg-primary'] as const;

export function nightTone(count: number): string {
  return NIGHT_TONE[Math.min(count, NIGHT_TONE.length - 1)] ?? NIGHT_TONE[0];
}
