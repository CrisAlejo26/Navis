import { describe, expect, it } from 'vitest';

import { type DreamProgress, dreamState, isDreamFulfilled } from './dream-state';

const sueño = (partial: Partial<DreamProgress> = {}): DreamProgress => ({
  interpretation: null,
  fulfilledAt: null,
  ...partial,
});

describe('dreamState', () => {
  it('deja en apuntado el sueño que solo se ha escrito', () => {
    expect(dreamState(sueño())).toBe('apuntado');
  });

  it('pasa a estudio cuando hay interpretación', () => {
    expect(dreamState(sueño({ interpretation: 'Creo que habla de esperar' }))).toBe('estudio');
  });

  /* Regresión: el formulario manda cadena vacía al borrar el texto, y eso
     dejaba el sueño «en estudio» sin que nadie hubiera escrito nada. */
  it('no cuenta como estudio una interpretación en blanco', () => {
    expect(dreamState(sueño({ interpretation: '   ' }))).toBe('apuntado');
  });

  it('es cumplido en cuanto hay fecha, aunque no se hubiera interpretado', () => {
    expect(dreamState(sueño({ fulfilledAt: '2026-08-01' }))).toBe('cumplido');
  });

  it('el cumplimiento manda sobre la interpretación', () => {
    const cumplido = sueño({ interpretation: 'Un aviso', fulfilledAt: '2026-08-01' });
    expect(dreamState(cumplido)).toBe('cumplido');
  });
});

describe('isDreamFulfilled', () => {
  it('distingue el que ya pasó del que sigue abierto', () => {
    expect(isDreamFulfilled(sueño({ fulfilledAt: '2026-08-01' }))).toBe(true);
    expect(isDreamFulfilled(sueño())).toBe(false);
  });
});
