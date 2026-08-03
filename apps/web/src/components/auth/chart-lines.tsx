import { cn } from '@/lib/cn';

/**
 * Las curvas de nivel de una carta náutica: las isóbatas que marcan la
 * profundidad del fondo. Es el elemento firma de las pantallas de acceso
 * (Regla 9) y sale del mundo del proyecto —*navis* es «nave»—, no de un
 * degradado de relleno.
 *
 * Cada curva empieza y acaba a la misma altura y con la misma pendiente, así
 * que la banda se puede pegar consigo misma: se pinta dos veces dentro de un
 * contenedor del doble de ancho y se desplaza media anchura, con lo que el
 * bucle no tiene costura. Solo se mueve `transform`.
 */
const CONTOURS = [
  { y: 34, amplitude: 16, opacity: 0.16 },
  { y: 72, amplitude: 11, opacity: 0.26 },
  { y: 106, amplitude: 20, opacity: 0.14 },
  { y: 144, amplitude: 13, opacity: 0.3 },
  { y: 178, amplitude: 19, opacity: 0.16 },
  { y: 212, amplitude: 10, opacity: 0.22 },
];

const contourPath = ({ y, amplitude: a }: (typeof CONTOURS)[number]): string =>
  `M0 ${String(y)} C66 ${String(y - a)} 133 ${String(y + a)} 200 ${String(y)}` +
  ` C266 ${String(y - a)} 333 ${String(y + a)} 400 ${String(y)}`;

function Band() {
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="none"
      className="h-full w-1/2 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      vectorEffect="non-scaling-stroke"
    >
      {CONTOURS.map((contour) => (
        <path key={contour.y} d={contourPath(contour)} strokeOpacity={contour.opacity} />
      ))}
    </svg>
  );
}

/** Dos capas a distinta velocidad: la de atrás da profundidad a la de delante. */
export function ChartLines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('inset-0 pointer-events-none absolute overflow-hidden', className)}
    >
      <div className="animate-drift-slow flex h-full w-[200%] scale-y-[1.4] opacity-60">
        <Band />
        <Band />
      </div>
      <div className="inset-0 animate-drift absolute flex h-full w-[200%]">
        <Band />
        <Band />
      </div>
    </div>
  );
}
