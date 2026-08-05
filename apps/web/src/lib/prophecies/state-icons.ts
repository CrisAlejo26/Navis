import type { ProphecyState } from '@navis/shared';
import { Anchor, Hourglass, Waves, type LucideIcon } from 'lucide-react';

import { NEUTRAL_ACCENT } from '@/lib/export/columns';

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

/**
 * El mismo color, esta vez como **acento** —token o hexadecimal— para lo que
 * no entiende de clases: la pastilla de una exportación en Excel o en la
 * lámina (RFC 0009 D9). Sale de aquí y no se vuelve a elegir.
 */
export const STATE_ACCENT: Record<ProphecyState, string> = {
  espera: NEUTRAL_ACCENT,
  camino: 'primary',
  cumplida: 'success',
};

/** El color de cada estado, del token que le toca. */
export const STATE_TONE: Record<ProphecyState, string> = {
  espera: 'text-muted-foreground',
  camino: 'text-primary',
  cumplida: 'text-success',
};

/**
 * El tinte de la cabecera de la ficha, según en qué estado está (§7.6).
 *
 * Es lo mismo que hace la ficha de un sueño con sus emociones: el color lo pone
 * el dato y no la pantalla, así que dos profecías no se abren iguales. Al 22 %
 * y no al 8: por debajo del 12 % no se ve (RFC 0005 §7.1.3).
 */
export const STATE_SURFACE: Record<ProphecyState, string> = {
  espera: 'bg-muted',
  camino: 'bg-gradient-to-br from-primary/22 to-primary/5',
  cumplida: 'bg-gradient-to-br from-success/22 to-success/5',
};
