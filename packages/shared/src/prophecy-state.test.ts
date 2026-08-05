import { describe, expect, it } from 'vitest';

import { isFulfilled, prophecyState, waitingDays, type ProphecyProgress } from './prophecy-state';

function palabra(overrides: Partial<ProphecyProgress> = {}): ProphecyProgress {
  return {
    receivedAt: '2026-01-10',
    fulfilledAt: null,
    lastFulfillmentAt: null,
    ...overrides,
  };
}

describe('prophecyState', () => {
  it('está en espera cuando no se ha cumplido ni tiene cumplimientos parciales', () => {
    expect(prophecyState(palabra())).toBe('espera');
  });

  it('va en camino cuando tiene algún cumplimiento parcial pero sigue abierta', () => {
    expect(prophecyState(palabra({ lastFulfillmentAt: '2026-03-02' }))).toBe('camino');
  });

  it('está cumplida cuando tiene fecha de cumplimiento', () => {
    expect(prophecyState(palabra({ fulfilledAt: '2026-05-20' }))).toBe('cumplida');
  });

  it('sigue cumplida aunque tenga cumplimientos parciales por el camino', () => {
    // Tenerlos es lo normal, no una contradicción: la profecía se fue
    // cumpliendo a trozos y al final se cerró.
    const cerrada = palabra({ fulfilledAt: '2026-05-20', lastFulfillmentAt: '2026-03-02' });
    expect(prophecyState(cerrada)).toBe('cumplida');
  });
});

describe('waitingDays', () => {
  it('cuenta hasta hoy mientras sigue abierta', () => {
    expect(waitingDays(palabra(), '2026-01-20')).toBe(10);
  });

  it('cuenta hasta el día en que se cumplió, y no hasta hoy', () => {
    const cerrada = palabra({ fulfilledAt: '2026-01-30' });
    expect(waitingDays(cerrada, '2026-08-05')).toBe(20);
  });

  it('el mismo día en que se recibe la espera es cero', () => {
    expect(waitingDays(palabra(), '2026-01-10')).toBe(0);
  });

  it('nunca es negativa, aunque la reciba con fecha de mañana', () => {
    // Se aceptan fechas en el futuro (D7); lo que no puede es dar −1.
    expect(waitingDays(palabra({ receivedAt: '2026-02-01' }), '2026-01-10')).toBe(0);
  });
});

describe('isFulfilled', () => {
  it('distingue una profecía cerrada de una que solo va en camino', () => {
    expect(isFulfilled(palabra({ fulfilledAt: '2026-05-20' }))).toBe(true);
    expect(isFulfilled(palabra({ lastFulfillmentAt: '2026-03-02' }))).toBe(false);
  });
});
