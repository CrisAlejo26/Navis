import { describe, expect, it } from 'vitest';

import { WAKE_MIN_DAYS, wakeShape } from './wake-path';

const dias = (valores: number[]) => wakeShape(valores, 300, 60);

describe('la geometría de la estela', () => {
  it('devuelve un punto por día', () => {
    expect(dias([1, 2, 3, 4, 5]).points).toHaveLength(5);
  });

  it('empieza en el borde izquierdo y acaba en el derecho', () => {
    const { points } = dias([1, 1, 1, 1]);

    expect(points[0]?.x).toBe(0);
    expect(points.at(-1)?.x).toBe(300);
  });

  it('se estrecha hacia la izquierda: con las mismas visitas, hoy abulta más', () => {
    const { points } = dias([5, 5, 5, 5, 5]);

    expect(points.at(-1)?.half).toBeGreaterThan(points[0]?.half ?? 0);
  });

  it('el grosor es proporcional a las visitas de cada día', () => {
    const { points } = dias([0, 0, 0, 5, 10]);

    expect(points[0]?.half).toBe(0);
    expect(points.at(-1)?.half).toBe(30);
  });

  it('nunca se sale del lienzo', () => {
    for (const punto of dias([9, 1, 40, 3, 7, 2]).points) {
      expect(punto.half).toBeLessThanOrEqual(30);
      expect(punto.x).toBeLessThanOrEqual(300);
      expect(punto.x).toBeGreaterThanOrEqual(0);
    }
  });

  it('cierra el polígono: ida por arriba y vuelta por abajo', () => {
    const { area } = dias([1, 2, 3, 4]);

    expect(area.startsWith('M')).toBe(true);
    expect(area.endsWith('Z')).toBe(true);
    // Ocho vértices para cuatro días: cada uno aporta su arriba y su abajo.
    expect(area.split('L')).toHaveLength(8);
  });

  it('marca el día de más visitas, porque el grosor no puede informar solo', () => {
    expect(dias([1, 9, 2, 3]).peak).toBe(1);
  });

  it('con todo a cero no marca ningún día ni dibuja banda', () => {
    const forma = dias([0, 0, 0, 0, 0]);

    expect(forma.peak).toBe(-1);
    expect(forma.points.every((one) => one.half === 0)).toBe(true);
    expect(forma.enough).toBe(false);
  });

  it('no se dibuja con menos de cuatro días con visitas', () => {
    expect(dias([1, 0, 2, 0, 3]).enough).toBe(false);
    expect(dias([1, 1, 1, 1]).enough).toBe(true);
    expect(WAKE_MIN_DAYS).toBe(4);
  });

  it('no revienta con una serie vacía', () => {
    const forma = wakeShape([], 300, 60);

    expect(forma.area).toBe('');
    expect(forma.points).toEqual([]);
    expect(forma.enough).toBe(false);
  });

  it('con un solo día lo pone en la proa y no divide por cero', () => {
    const { points } = wakeShape([4], 300, 60);

    expect(points[0]?.x).toBe(300);
    expect(Number.isFinite(points[0]?.half)).toBe(true);
  });
});
