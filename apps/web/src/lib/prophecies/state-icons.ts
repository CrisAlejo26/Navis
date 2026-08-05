import type { ProphecyState } from '@navis/shared';
import { Anchor, Hourglass, Waves, type LucideIcon } from 'lucide-react';

/**
 * El icono de cada estado (RFC 0004 §7.1).
 *
 * No es adorno: es lo que hace que el estado se distinga **sin depender del
 * color** (Regla 3 §7), y por eso lo comparten la pastilla y los filtros.
 * Ninguno de los tres se lee como una cruz de lejos (Regla 7 §6).
 *
 * En su propio fichero y no junto al componente: mezclarlos rompe el recambio
 * en caliente de Vite, que quiere módulos que solo exporten componentes.
 */
export const STATE_ICON: Record<ProphecyState, LucideIcon> = {
  /** Un reloj de arena: todavía no ha pasado nada. */
  espera: Hourglass,
  /** Olas: se está cumpliendo a trozos, la travesía está en marcha. */
  camino: Waves,
  /** Un ancla: se llegó. */
  cumplida: Anchor,
};

/** El color de cada estado, del token que le toca. */
export const STATE_TONE: Record<ProphecyState, string> = {
  espera: 'text-muted-foreground',
  camino: 'text-primary',
  cumplida: 'text-success',
};
