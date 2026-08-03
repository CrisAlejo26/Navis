/**
 * La forma del icono, definida UNA sola vez.
 *
 * De aquí salen las dos representaciones que necesita el proyecto:
 *   · el atributo `d` del SVG        → `rutaSvg()`
 *   · el dibujo píxel a píxel de los PNG → `enTrazo()`
 *
 * Antes cada una tenía su propia copia de la geometría: cambiabas el SVG y los
 * PNG se quedaban con el dibujo viejo, así que web y móvil acababan con iconos
 * distintos sin que nadie se enterara. Un test comprueba que el SVG del
 * repositorio sigue coincidiendo con lo que sale de aquí.
 *
 * Es un cayado de pastor. Nada de cruces:
 * ver .claude/rules/07-sin-cruces-en-la-identidad.md
 */

/** Lienzo cuadrado de referencia; todas las coordenadas van en esta escala. */
export const LIENZO = 64;

/** Radio de las esquinas del fondo. */
export const RADIO_FONDO = 14;

/** Grosor del trazo. */
export const GROSOR = 6;

export const COLOR_FONDO = '#3b63be'; // --light-primary de packages/theme
export const COLOR_TRAZO = '#ffffff';

/**
 * El cayado: el bastón sube, gira por encima y se enrosca hacia abajo.
 * Con la Y hacia abajo, el ángulo 270° es «arriba» y el 90° «abajo».
 */
export const TRAZOS = [
  { tipo: 'linea', desde: [27, 52], hasta: [27, 21] },
  { tipo: 'arco', centro: [36, 21], radio: 9, desde: 180, hasta: 360 },
  { tipo: 'arco', centro: [40, 21], radio: 5, desde: 0, hasta: 180 },
];

const enRadianes = (grados) => (grados * Math.PI) / 180;

const puntoDelArco = ({ centro: [cx, cy], radio }, grados) => [
  cx + radio * Math.cos(enRadianes(grados)),
  cy + radio * Math.sin(enRadianes(grados)),
];

/** Redondea lo justo para que el SVG no acumule decimales de coma flotante. */
const n = (valor) => Number(valor.toFixed(3));

/** Construye el atributo `d` del SVG a partir de los trazos. */
export function rutaSvg() {
  const partes = [];

  for (const trazo of TRAZOS) {
    if (trazo.tipo === 'linea') {
      const [[x1, y1], [x2, y2]] = [trazo.desde, trazo.hasta];
      partes.push(`M${n(x1)} ${n(y1)}`, `L${n(x2)} ${n(y2)}`);
      continue;
    }

    const [x, y] = puntoDelArco(trazo, trazo.hasta);
    const barrido = trazo.hasta > trazo.desde ? 1 : 0; // sentido horario
    const arcoGrande = Math.abs(trazo.hasta - trazo.desde) > 180 ? 1 : 0;
    partes.push(`A${n(trazo.radio)} ${n(trazo.radio)} 0 ${arcoGrande} ${barrido} ${n(x)} ${n(y)}`);
  }

  return partes.join(' ');
}

const distanciaASegmento = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

function enArco(px, py, { centro: [cx, cy], radio, desde, hasta }) {
  if (Math.abs(Math.hypot(px - cx, py - cy) - radio) > GROSOR / 2) return false;
  let angulo = (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
  while (angulo < desde) angulo += 360;
  return angulo <= hasta;
}

/** ¿Cae el punto (en coordenadas del lienzo) sobre el trazo? */
export function enTrazo(x, y) {
  for (const trazo of TRAZOS) {
    if (trazo.tipo === 'linea') {
      if (distanciaASegmento(x, y, trazo.desde, trazo.hasta) <= GROSOR / 2) return true;
      continue;
    }
    if (enArco(x, y, trazo)) return true;
    // Remates redondos en los extremos del arco, como el stroke-linecap.
    for (const grados of [trazo.desde, trazo.hasta]) {
      const [ax, ay] = puntoDelArco(trazo, grados);
      if (Math.hypot(x - ax, y - ay) <= GROSOR / 2) return true;
    }
  }
  return false;
}

/** ¿Cae dentro del cuadrado de esquinas redondeadas del fondo? */
export function enFondo(x, y, radio = RADIO_FONDO) {
  const dx = Math.min(x, LIENZO - x);
  const dy = Math.min(y, LIENZO - y);
  if (dx >= radio || dy >= radio) return true;
  return (radio - dx) ** 2 + (radio - dy) ** 2 <= radio * radio;
}

/** El SVG completo, que es lo que se escribe en packages/theme. */
export function svg(nombre) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LIENZO} ${LIENZO}" role="img" aria-label="${nombre}">
  <!--
    GENERADO por \`pnpm icons\` desde scripts/brand-shape.mjs. No lo edites a
    mano: la geometría vive allí y de ella salen también los PNG.
  -->
  <rect width="${LIENZO}" height="${LIENZO}" rx="${RADIO_FONDO}" fill="${COLOR_FONDO}" />
  <path
    d="${rutaSvg()}"
    fill="none"
    stroke="${COLOR_TRAZO}"
    stroke-width="${GROSOR}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`;
}
