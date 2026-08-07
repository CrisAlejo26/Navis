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
 * Cada fogonazo es una roseta de doce chispas en dos anillos —no cuatro en
 * cruz—, y cada uno lleva **su propia paleta** de seis tonos de
 * `ACCENT_PALETTE` (dorado, rosa-violeta, cian), para que los tres fogonazos
 * no se lean como el mismo destello repetido tres veces. Los hexadecimales de
 * esa paleta ya están pensados para leerse en claro y en oscuro sin un valor
 * por tema (Regla 3 §3), así que se escriben literales — es la misma
 * excepción documentada que ya usan sedes, dones y listas.
 *
 * Un pedido habitual para «que quede como un fuego artificial de verdad» trae
 * una animación que crece con `width` (una imagen de fondo con varios
 * `radial-gradient` y el elemento ensanchándose de 0 a su tamaño final). Eso
 * fuerza a recalcular el diseño en cada fotograma y está prohibido aquí
 * (Regla 9 §5): el mismo efecto —una chispa que nace pegada al centro y se
 * separa hacia fuera— sale igual moviendo `transform: translate3d()` y
 * `scale()`, que el compositor resuelve sin tocar el layout. Por eso cada
 * chispa es su propio elemento con su vector `--chispa-x`/`--chispa-y`, en
 * vez de una sola imagen de fondo que se ensancha.
 *
 * Solo mueve `opacity` y `transform` (Regla 9 §5), va detrás de todo con
 * `-z-10` sobre la celda entera —no ya sobre el botón del número— y
 * desaparece con `prefers-reduced-motion` (regla global de
 * `styles/global.css`): el festivo se sigue reconociendo por el número en
 * rojo y su nombre, que no dependen de que nada se mueva.
 */

/** Dorado y verde: el fogonazo de arriba a la izquierda. */
const PALETA_DORADA = ['#ca8a04', '#ea580c', '#dc2626', '#65a30d', '#16a34a', '#e11d48'] as const;
/** Rosa y violeta: el fogonazo de la derecha. */
const PALETA_ROSA = ['#e11d48', '#db2777', '#c026d3', '#9333ea', '#6d28d9', '#4f46e5'] as const;
/** Cian y azul: el fogonazo de abajo. */
const PALETA_CIAN = ['#2140cf', '#0284c7', '#0891b2', '#0d9488', '#4f46e5', '#57534e'] as const;

/** Los tres fogonazos: dónde, en porcentaje de la celda, con qué retardo y de qué colores. */
const FOGONAZOS = [
  { left: '20%', top: '32%', delay: 0, paleta: PALETA_DORADA },
  { left: '72%', top: '58%', delay: 1500, paleta: PALETA_ROSA },
  { left: '44%', top: '82%', delay: 3000, paleta: PALETA_CIAN },
] as const;

const CHISPAS_POR_FOGONAZO = 12;

/**
 * Doce vectores en dos anillos (16 px y 22 px alternos): una roseta más
 * llena que un simple cuadrado de cuatro puntas, y con el anillo alterno se
 * lee orgánica en vez de un círculo perfecto y mecánico.
 */
const CHISPAS = Array.from({ length: CHISPAS_POR_FOGONAZO }, (_, index) => {
  const angulo = (index * Math.PI * 2) / CHISPAS_POR_FOGONAZO;
  const radio = index % 2 === 0 ? 16 : 22;
  return {
    x: `${String(Math.round(Math.cos(angulo) * radio))}px`,
    y: `${String(Math.round(Math.sin(angulo) * radio))}px`,
  };
});

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
            style={
              {
                '--destello-color': fogonazo.paleta[0],
                animationDelay: `${String(desfase + fogonazo.delay)}ms`,
              } as React.CSSProperties
            }
            className="animate-destello -inset-5 absolute rounded-full bg-[var(--destello-color)] opacity-40"
          />

          {CHISPAS.map((chispa, index) => (
            <span
              key={chispa.x + chispa.y}
              style={
                {
                  '--chispa-x': chispa.x,
                  '--chispa-y': chispa.y,
                  '--chispa-color': fogonazo.paleta[index % fogonazo.paleta.length],
                  animationDelay: `${String(desfase + fogonazo.delay + 90)}ms`,
                } as React.CSSProperties
              }
              className="animate-chispa size-1 absolute rounded-full bg-[var(--chispa-color)]"
            />
          ))}
        </span>
      ))}
    </span>
  );
}
