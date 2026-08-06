/**
 * El chispazo de un día festivo (RFC 0011).
 *
 * Salta **una vez, al pintar el mes**, que es justo cuando alguien está
 * recorriendo la cuadrícula buscando dónde cae la reunión. En bucle sería otra
 * cosa: dos o tres celdas parpadeando sin parar dejan de avisar de nada y se
 * leen como una pantalla estropeada.
 *
 * Solo mueve `opacity` y `transform` —lo único que el compositor resuelve sin
 * recalcular el diseño (Regla 9 §5)—, va detrás del número con `-z-10` para no
 * taparlo, y con `prefers-reduced-motion` desaparece: lo apaga la regla global
 * de `styles/global.css`, y entonces el festivo se sigue reconociendo por el
 * número en rojo y por su nombre, que no dependen de que nada se mueva.
 */

/** Las cinco chispas: su ángulo ya resuelto y de qué color va cada una. */
const CHISPAS = [
  { x: '-14px', y: '-12px', tone: 'bg-destructive' },
  { x: '13px', y: '-14px', tone: 'bg-warning' },
  { x: '17px', y: '4px', tone: 'bg-success' },
  { x: '-16px', y: '6px', tone: 'bg-primary' },
  { x: '2px', y: '-18px', tone: 'bg-warning' },
] as const;

export function HolidayBurst({ day }: { day: number }) {
  // Escalonado por el día del mes: si los tres festivos de diciembre saltaran
  // a la vez, el ojo vería un fogonazo y no tres días.
  const retardo = (day % 5) * 90;

  return (
    <span aria-hidden className="top-3.5 left-3.5 size-0 pointer-events-none absolute -z-10">
      <span
        style={{ animationDelay: `${String(retardo)}ms` }}
        className="animate-destello -inset-3 absolute rounded-full bg-warning/50"
      />

      {CHISPAS.map((chispa) => (
        <span
          key={`${chispa.x}${chispa.y}`}
          style={
            {
              '--chispa-x': chispa.x,
              '--chispa-y': chispa.y,
              animationDelay: `${String(retardo + 60)}ms`,
            } as React.CSSProperties
          }
          className={`animate-chispa size-1 absolute rounded-full ${chispa.tone}`}
        />
      ))}
    </span>
  );
}
