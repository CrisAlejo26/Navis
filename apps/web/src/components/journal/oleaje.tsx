const WIDTH = 400;
const HEIGHT = 32;

/** Una onda suave, de un borde al otro de la banda. */
function wavePath(y: number, amplitude: number): string {
  const top = y - amplitude;
  const bottom = y + amplitude;
  return `M0 ${String(y)} C${String(WIDTH / 4)} ${String(top)} ${String((WIDTH * 3) / 4)} ${String(bottom)} ${String(WIDTH)} ${String(y)}`;
}

/** Dos trazos, cada uno con su opacidad: es lo único que lleva esta cinta. */
function Band() {
  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      preserveAspectRatio="none"
      className="h-full w-1/2 shrink-0"
      fill="none"
    >
      <path
        d={wavePath(HEIGHT / 2, 7)}
        className="stroke-primary/35"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={wavePath(HEIGHT / 2 + 5, 5)}
        className="stroke-primary/15"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * El elemento firma del cuaderno (D14, §7.6): la única animación en bucle de
 * todo el proyecto además de la deriva de la carta náutica, y la única que no
 * vive en una pantalla de acceso.
 *
 * Misma costura que `ChartLines`: la banda se pinta **dos veces** dentro de un
 * contenedor del doble de ancho y se desplaza media anchura —`translate3d`,
 * que el compositor resuelve sin recalcular *layout*—, así el bucle no da
 * ningún salto. Solo dos trazos finos y ningún color más: con más encima
 * dejaría de leerse como un horizonte y pasaría a ser ruido.
 *
 * Se apaga con `prefers-reduced-motion` por la regla global de
 * `global.css` (`animation-duration` a cero e iteración única): la cinta se
 * queda fija en un fotograma en vez de desaparecer, y como el bucle no tiene
 * costura, cualquier fotograma se sigue leyendo como una línea de horizonte.
 */
export function Oleaje({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className ?? 'h-8 w-full overflow-hidden'}>
      <div className="animate-oleaje flex h-full w-[200%]">
        <Band />
        <Band />
      </div>
    </div>
  );
}
