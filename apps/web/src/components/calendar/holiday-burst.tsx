/**
 * El festivo del calendario (RFC 0011): una pequeña constelación detrás del
 * número, no una sola chispa pegada a su esquina.
 *
 * Va a **todo el ancho y alto de la celda** —tres fogonazos repartidos, cada
 * uno con sus chispas— y se repite despacio y sin parar, cada uno a su propio
 * retardo: nunca laten dos a la vez, y el conjunto se lee como un cielo con
 * estrellas y no como una sola chispa que hay que cazar al vuelo. El primer
 * diseño saltaba una vez junto al número con un único fogonazo; en una celda
 * de varias líneas de alto eso dejaba casi todo el espacio vacío y, al durar
 * menos de un segundo, la mayoría de quien mirase la cuadrícula no llegaba a
 * verlo.
 *
 * Solo mueve `opacity` y `transform` (Regla 9 §5), va detrás de todo con
 * `-z-10` sobre la celda entera —no ya sobre el botón del número— y
 * desaparece con `prefers-reduced-motion` (regla global de
 * `styles/global.css`): el festivo se sigue reconociendo por el número en
 * rojo y su nombre, que no dependen de que nada se mueva.
 */

/** Los tres fogonazos: dónde, en porcentaje de la celda, y con qué retardo. */
const FOGONAZOS = [
  { left: '20%', top: '32%', delay: 0 },
  { left: '72%', top: '58%', delay: 1500 },
  { left: '44%', top: '82%', delay: 3000 },
] as const;

/** Las chispas de cada fogonazo: su ángulo relativo y de qué color va. */
const CHISPAS = [
  { x: '-16px', y: '-14px', tone: 'bg-destructive' },
  { x: '15px', y: '-12px', tone: 'bg-warning' },
  { x: '18px', y: '10px', tone: 'bg-success' },
  { x: '-18px', y: '11px', tone: 'bg-primary' },
] as const;

export function HolidayBurst({ day }: { day: number }) {
  // Un pequeño desfase por el día del mes: dos festivos del mismo mes no
  // titilan al unísono.
  const desfase = (day % 3) * 240;

  return (
    <span aria-hidden className="inset-0 pointer-events-none absolute -z-10">
      {FOGONAZOS.map((fogonazo) => (
        <span
          key={fogonazo.left + fogonazo.top}
          style={{ left: fogonazo.left, top: fogonazo.top }}
          className="size-0 absolute"
        >
          <span
            style={{ animationDelay: `${String(desfase + fogonazo.delay)}ms` }}
            className="animate-destello -inset-3 absolute rounded-full bg-warning/50"
          />

          {CHISPAS.map((chispa) => (
            <span
              key={chispa.x + chispa.y}
              style={
                {
                  '--chispa-x': chispa.x,
                  '--chispa-y': chispa.y,
                  animationDelay: `${String(desfase + fogonazo.delay + 90)}ms`,
                } as React.CSSProperties
              }
              className={`animate-chispa size-1 absolute rounded-full ${chispa.tone}`}
            />
          ))}
        </span>
      ))}
    </span>
  );
}
