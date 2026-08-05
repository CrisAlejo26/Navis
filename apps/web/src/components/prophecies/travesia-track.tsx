import type { ProphecyListItem } from '@navis/shared';

import { cn } from '@/lib/cn';
import { percentOf, trackOf, type TravesiaRange } from '@/lib/prophecies/travesia';

/** Hasta dónde se escalona la entrada: más allá, la cascada solo hace esperar. */
const STAGGERED_ROWS = 12;

/**
 * El trayecto de **una** profecía en el eje del tiempo (RFC 0004 §7.5).
 *
 * Empieza el día que se recibió, lleva una marca por cada cumplimiento parcial
 * y se cierra con un rombo el día que se cumplió. Las que siguen en espera **no
 * terminan**: se desvanecen hacia el borde derecho, que es hoy.
 *
 * Todo el trazado va `aria-hidden`; lo que lee un lector de pantalla es el
 * texto que pone `Travesia` al lado (§7.5).
 */
export function TravesiaTrack({
  item,
  range,
  index,
}: {
  item: ProphecyListItem;
  range: TravesiaRange;
  index: number;
}) {
  const track = trackOf(item, range);

  return (
    <div aria-hidden className="h-5 relative w-full">
      {/* La pista de fondo, para que se vea el hueco que no ocupa nadie. */}
      <span className="right-0 left-0 absolute top-1/2 h-px -translate-y-1/2 bg-border" />

      <span
        className={cn(
          'absolute top-1/2 h-[3px] origin-left -translate-y-1/2 rounded-full',
          // `prefers-reduced-motion` la apaga desde `global.css`, como todo lo
          // demás: con `both` el trayecto se queda igualmente en su sitio.
          'animate-track-in',
          track.open
            ? 'bg-gradient-to-r from-primary via-primary to-primary/10'
            : 'bg-gradient-to-r from-success/70 to-success',
        )}
        style={{
          left: track.left,
          width: track.width,
          // Escalonado por fila, y solo las primeras doce (§7.8).
          animationDelay: `${String(Math.min(index, STAGGERED_ROWS) * 40)}ms`,
        }}
      />

      {/* Punto de salida: el día en que se recibió. */}
      <span
        className="h-2 w-2 absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground/60"
        style={{ left: track.left }}
      />

      {item.fulfillmentDays.map((day) => (
        <span
          key={day}
          className="h-1.5 w-1.5 absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
          style={{ left: percentOf(day, range) }}
        />
      ))}

      {/* Se cierra con un rombo el día que se cumplió. */}
      {item.fulfilledAt && (
        <span
          className="h-2 w-2 absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-success ring-2 ring-background"
          style={{ left: percentOf(item.fulfilledAt, range) }}
        />
      )}
    </div>
  );
}
