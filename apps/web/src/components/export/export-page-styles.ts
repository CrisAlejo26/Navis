import type { CSSProperties } from 'react';

/**
 * Los estilos de la lámina de exportación, **en línea y en hexadecimal**.
 *
 * No es una preferencia: `rasterize.ts` mete el nodo dentro de un
 * `<foreignObject>` y solo funciona si es autocontenido —nada de clases, nada
 * de `oklch` y nada de imágenes remotas—. Por eso no se usa ni un token de
 * Tailwind aquí y por eso la lámina se compone aparte en vez de capturar la
 * pantalla (RFC 0002 D13 y D14).
 */
export const SHEET_WIDTH = 1123;
export const SHEET_HEIGHT = 794;

/** Cuántas filas caben en una página con esta altura. */
export const ROWS_PER_PAGE = 18;

/**
 * Cuántas caben en **una sola imagen**. Por encima, la opción se apaga y
 * manda al PDF: un PNG de trescientas filas es un lienzo que el navegador ya
 * no sabe pintar, y uno de sesenta ya es una captura larguísima.
 */
export const IMAGE_MAX_ROWS = 60;

const BRAND = '#2140cf';
const RULE = '#e3e6ef';

export const styles = {
  sheet: {
    width: `${String(SHEET_WIDTH)}px`,
    backgroundColor: '#ffffff',
    color: '#181b1f',
    fontFamily: 'Arial, Helvetica, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  band: {
    backgroundColor: BRAND,
    color: '#ffffff',
    padding: '18px 28px',
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    backgroundColor: '#eef1fc',
    color: '#3a3f55',
    padding: '8px 28px',
    fontSize: '12px',
  },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th: {
    backgroundColor: BRAND,
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    textAlign: 'left',
    padding: '10px 10px',
    borderRight: '1px solid rgba(255,255,255,0.25)',
  },
  td: {
    fontSize: '11px',
    padding: '8px 10px',
    borderBottom: `1px solid ${RULE}`,
    verticalAlign: 'top',
    wordBreak: 'break-word',
  },
  footer: {
    padding: '10px 28px',
    fontSize: '10px',
    color: '#636975',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: `1px solid ${RULE}`,
  },
} satisfies Record<string, CSSProperties>;

/** La pastilla de una etiqueta, con su color mezclado con blanco al 15 %. */
export function pillStyle(hex: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 7px',
    marginRight: '4px',
    borderRadius: '999px',
    fontSize: '10px',
    color: hex,
    backgroundColor: mixWithWhite(hex, 0.15),
  };
}

function mixWithWhite(hex: string, ratio: number): string {
  const clean = hex.replace('#', '');
  const canal = (offset: number) => {
    const valor = Number.parseInt(clean.slice(offset, offset + 2), 16);
    return Math.round(valor * ratio + 255 * (1 - ratio));
  };

  return `rgb(${String(canal(0))}, ${String(canal(2))}, ${String(canal(4))})`;
}
