import { G, Path } from 'react-native-svg';

/**
 * El barco del logo de Navis, servido como pieza de la escena plana del hero.
 *
 * Los trazos salen de `packages/theme/src/logo/logo_blanco_sin_fondo_
 * sin_degradado.svg` —la variante sin degradado, las seis piezas del dibujo
 * en blanco— y las tiñe la hora: de día navega **del color del sol**, en
 * dorados; de noche **del color de la luna**, en plateados. El tamaño y el
 * emplazamiento no cambian nunca.
 *
 * Se dibuja **en su espacio original** (el lienzo de 1080): un único `G` con
 * `translate` + `scale` lleva el trazo al tamaño y al sitio que pide la
 * escena, así que ninguna coordenada se toca a mano.
 */

const ROTA =
  'M910.13,597.56c-.11,3.31-4.45,7.95-7.91,9.42-17.12,7.24-34.72,13.33-51.86,20.54-3.84,1.61-8.39,5.54-9.4,9.28-8.22,30.4-19.97,59.14-33.54,87.03-15.48,31.81-33.32,62.5-51.01,93.27-8.37,14.57-14.34,33.74-27.09,41.63-11.71,7.25-31.06,2.43-47.04,2.45-53.32.05-106.63,0-159.95.03-34.18.01-68.36.06-102.54.2-9.48.04-14.51-2.9-19.21-11.24-24.51-43.47-49.7-86.59-71.63-131.36-10.58-21.58-20.4-43.55-29.02-66.13-1.55-4.04-3.61-7.97-4.53-12.15-1.54-6.98-3.69-13.41-6.34-19.39h-.01c-14.9-33.58-45.85-52.76-76.08-72.44-16.31-10.63-33.32-20.16-49.95-30.31-1.64-1-2.79-2.83-3.41-5.99,40.44,9.02,77.78,27.21,118.7,39.59,0-5.25.07-9.38-.01-13.51-.56-26.88,10.85-47.63,34.83-59.06,54.41-25.92,108.61-22.19,164.49,4.29-30.89,30.19-43.8,66.04-43.08,109.85-39.59-36.89-83.7-46.88-133.75-33.14,21.95,8.28,43.83,16.76,65.88,24.77,19.9,7.23,39.9,14.22,60.05,20.72,7.13,2.3,9.88,6.18,11.59,13.46,7.97,33.87,32.89,63.98,63.98,82.37,14.11,8.36,29.48,14.29,45.12,17.06,8.21,1.46,16.49,2.05,24.7,1.66,51.36-2.46,105.36-42.7,121.18-92.29,4.45-13.95,11.58-20.56,25.12-25.38,61.88-22.03,123.3-45.36,184.89-68.21,1.55-.57,3.18-.95,7.2-2.14,0,22.81.35,43.98-.37,65.12Z';

const VELA_MAYOR =
  'M812.77,556.99c-24.7,0-52.27-1.48-79.61.4-30.35,2.08-57.87,14.12-81.99,32.66-3.53,2.71-5.78,10.72-4.62,15.25,4.98,19.5,11.45,38.61,18.11,60.24-59.57-40.82-123.15-64.84-196.36-61.23-9.09-52.56,8.11-93.75,50.67-126.83-50.58-32.41-103.69-31.14-160.14-19.32-3.72-16.45-4.49-32.44,1.55-48.04,14.26-36.79,43.47-57.07,79.2-69.44,79.55-27.54,156.19-14,231.29,17.36,12.71,5.31,24.6,12.6,36.76,19.17,2.14,1.15,3.77,3.25,6.45,5.63-38.17,40.58-64.51,86.42-70.78,142.12,36.1-74.7,94.81-123.74,169.91-153.23-4.69,31.68-12.92,62.96-12.95,94.25-.03,31,8.19,62.02,12.5,91.01Z';

const VELA_MENOR =
  'M708.87,269.35c-14.89,18.23-29.55,36.17-45.29,55.43-68.94-25.81-139.17-23.45-210.28,8.21,2.9-21.7,10.71-39.17,25.05-53.51,17.44-17.45,39.5-26.33,63.05-31.24,56.36-11.73,110.93-5.34,163.51,18.02,1.48.66,2.64,2.03,3.95,3.08Z';

const GALLARDETE =
  'M689.1,225.11c-13.32,1.79-27.68,4.4-42.15,5.29-5.14.32-10.6-3.38-15.79-5.55-6.31-2.63-12.69-8.33-18.67-7.87-16.67,1.26-33.14,5.01-52.2,8.2,0-8.76-.54-18.09.34-27.28.25-2.67,4.5-7.01,7.01-7.08,18.02-.45,36.19-1.17,54.02.82,6.22.69,13.64,7.69,16.91,13.75,4.51,8.37,8.97,10.81,18.2,9.28,13.6-2.26,24.92,3.45,32.34,10.43Z';

const SOMBRA_DERECHA =
  'M807.42,723.83c-15.48,31.81-33.32,62.5-51.01,93.27-8.37,14.57-14.34,33.74-27.09,41.63-11.71,7.25-31.06,2.43-47.04,2.45-53.32.05-106.63,0-159.95.03l137.38-137.38h147.71Z';

const SOMBRA_IZQUIERDA =
  'M547.44,718.81h-218.49c-10.58-21.58-20.4-43.55-29.02-66.13-1.55-4.04-3.61-7.97-4.53-12.15-1.54-6.98-3.69-13.41-6.34-19.39l213.23,80.6,45.12,17.06h.03Z';

/** Las seis piezas del barco, en el orden del dibujo original. */
export const BOAT_PATHS = [
  ROTA,
  VELA_MAYOR,
  VELA_MENOR,
  GALLARDETE,
  SOMBRA_DERECHA,
  SOMBRA_IZQUIERDA,
] as const;

/**
 * El barco en **un solo color**, a cualquier tamaño y posición: la caja del
 * dibujo mide 757 de ancha y arranca en (156, 142) dentro del lienzo de 1080.
 * La lámina del calendario lo usa en blanco sobre la banda de marca.
 */
export function BoatGlyph({
  size,
  x,
  y,
  fill,
}: {
  size: number;
  x: number;
  y: number;
  fill: string;
}) {
  const escala = size / 757;
  const colocacion = `translate(${(x - 156 * escala).toFixed(2)} ${(y - 142 * escala).toFixed(
    2,
  )}) scale(${escala.toFixed(5)})`;

  return (
    <G transform={colocacion}>
      {BOAT_PATHS.map((d) => (
        <Path key={d.slice(0, 12)} d={d} fill={fill} />
      ))}
    </G>
  );
}

/**
 * De dónde a dónde: la caja del dibujo dentro del lienzo de 1080 (medida por
 * `scripts/brand-logo.mjs`) y el mismo trazo a escala dentro de la escena,
 * con la línea de flotación donde la tenía el velero de la primera versión.
 */
const EN_LOGO = { x: 156, fondo: 865 };
const EN_ESCENA = { centro: 178, ancho: 132, flotacion: 272 };
const ESCALA = EN_ESCENA.ancho / 757;
const COLOCACION = `translate(${String((EN_ESCENA.centro - EN_ESCENA.ancho / 2 - EN_LOGO.x * ESCALA).toFixed(2))} ${String((EN_ESCENA.flotacion - EN_LOGO.fondo * ESCALA).toFixed(2))}) scale(${String(ESCALA.toFixed(5))})`;

type Tinta = {
  /** La rota: la ola que hace de casco. */
  rota: string;
  vela: string;
  velaMenor: string;
  gallardete: string;
  /** Las dos cuñas de sombra sobre la rota, la derecha y la izquierda. */
  sombraDerecha: string;
  sombraIzquierda: string;
};

/** Día: el barco del color del sol, en dorados. Noche: del color de la luna. */
const TINTAS: Record<'day' | 'night', Tinta> = {
  day: {
    rota: '#f2c14e',
    vela: '#ffdf8e',
    velaMenor: '#fff3c4',
    gallardete: '#e8962e',
    sombraDerecha: '#dfa32e',
    sombraIzquierda: '#f6c95e',
  },
  night: {
    rota: '#9fb0d8',
    vela: '#c6d2ee',
    velaMenor: '#e2e9f8',
    gallardete: '#7c8fbd',
    sombraDerecha: '#67779f',
    sombraIzquierda: '#8a9cc6',
  },
};

export function LogoBoat({ variant }: { variant: 'day' | 'night' }) {
  const tinta = TINTAS[variant];

  return (
    <G transform={COLOCACION}>
      <Path d={ROTA} fill={tinta.rota} />
      <Path d={VELA_MAYOR} fill={tinta.vela} />
      <Path d={VELA_MENOR} fill={tinta.velaMenor} />
      <Path d={GALLARDETE} fill={tinta.gallardete} />
      <Path d={SOMBRA_DERECHA} fill={tinta.sombraDerecha} />
      <Path d={SOMBRA_IZQUIERDA} fill={tinta.sombraIzquierda} />
    </G>
  );
}
