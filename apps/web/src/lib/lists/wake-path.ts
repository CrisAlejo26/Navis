/**
 * La geometría de **la estela** (RFC 0010 §8.4).
 *
 * Las visitas de los últimos treinta días dibujadas como el rastro que deja un
 * barco: una banda simétrica alrededor de una línea central, ancha a la derecha
 * —hoy— y estrechándose hacia la izquierda, con el grosor de cada día
 * proporcional a sus visitas.
 *
 * Está aquí y no dentro del componente porque es aritmética con su test: un
 * polígono mal cerrado o un día que se sale del lienzo no se ven en una captura,
 * se ven en producción.
 */
export interface WakeShape {
  /** El polígono cerrado de la banda, listo para un `<path d>`. */
  area: string;
  /** Un punto por día: dónde cae y cuánto abulta. Lo usan los objetivos táctiles. */
  points: { x: number; half: number; value: number }[];
  /** El día de más visitas, que va marcado y rotulado: el grosor no informa solo. */
  peak: number;
  /** Con menos de esto no se dibuja nada: tres puntos no son una estela. */
  enough: boolean;
}

/** Menos de cuatro días con visitas y se enseña la cifra, no un garabato. */
export const WAKE_MIN_DAYS = 4;

/** Lo que se estrecha hacia la izquierda: el ancho de la estela más antigua. */
const TAPER_MIN = 0.25;

export function wakeShape(values: readonly number[], width: number, height: number): WakeShape {
  const total = values.length;
  const half = height / 2;
  const max = Math.max(...values, 0);
  const conVisitas = values.filter((one) => one > 0).length;

  const points = values.map((value, index) => {
    const t = total > 1 ? index / (total - 1) : 1;
    // La proa —hoy— a la derecha; la estela se cierra hacia atrás.
    const taper = TAPER_MIN + (1 - TAPER_MIN) * t;
    const ratio = max > 0 ? value / max : 0;

    return { x: round(t * width), half: round(half * taper * ratio), value };
  });

  return {
    area: closedPath(points, half),
    points,
    peak: max > 0 ? values.indexOf(max) : -1,
    enough: conVisitas >= WAKE_MIN_DAYS,
  };
}

/** Ida por arriba y vuelta por abajo: un solo trazo cerrado, sin costura. */
function closedPath(points: readonly { x: number; half: number }[], center: number): string {
  if (points.length === 0) return '';

  const arriba = points.map((one) => `${String(one.x)},${String(round(center - one.half))}`);
  const abajo = [...points]
    .reverse()
    .map((one) => `${String(one.x)},${String(round(center + one.half))}`);

  return `M${arriba.join(' L')} L${abajo.join(' L')} Z`;
}

/** Dos decimales: un SVG con quince por coordenada pesa el triple y se ve igual. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
