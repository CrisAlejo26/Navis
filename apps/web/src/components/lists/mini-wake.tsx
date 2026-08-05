import { wakeShape } from '@/lib/lists/wake-path';

const ANCHO = 240;
const ALTO = 24;

/**
 * La estela en miniatura del pie de un panel: catorce días de visitas en 24 px
 * de alto (RFC 0010 §8.2).
 *
 * Es la figura de §8.4 en pequeño, y es lo que le da pulso a la portada en vez
 * de que sea un menú. `aria-hidden` a propósito: el dato entero se lee en la
 * ficha, con su tabla; aquí solo acompaña.
 */
export function MiniWake({ views }: { views: readonly number[] }) {
  const shape = wakeShape(views, ANCHO, ALTO);
  if (!shape.area) return null;

  return (
    <svg
      viewBox={`0 0 ${String(ANCHO)} ${String(ALTO)}`}
      preserveAspectRatio="none"
      aria-hidden
      className="h-6 -mx-5 -mb-5 pointer-events-none w-[calc(100%+2.5rem)]"
    >
      <path d={shape.area} fill="var(--acento-fg)" fillOpacity={0.4} />
    </svg>
  );
}
