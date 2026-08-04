import { describe, expect, it } from 'vitest';

import { alertRatio, daysWithoutNote, needsAttention, type AlertState } from './believer-alert';

const HOY = '2026-08-04';

const persona = (state: Partial<AlertState> = {}): AlertState => ({
  createdAt: '2026-01-10T09:30:00.000Z',
  lastNoteAt: null,
  alertAfterDays: 30,
  ...state,
});

describe('daysWithoutNote', () => {
  it('cuenta desde la última nota cuando la hay', () => {
    expect(daysWithoutNote(persona({ lastNoteAt: '2026-07-28' }), HOY)).toBe(7);
  });

  it('cuenta desde el alta cuando no hay ninguna nota', () => {
    // Justo el caso que hay que ver: alguien dado de alta y nunca atendido.
    expect(daysWithoutNote(persona({ createdAt: '2026-07-20T23:00:00.000Z' }), HOY)).toBe(15);
  });

  it('devuelve cero el mismo día de la nota', () => {
    expect(daysWithoutNote(persona({ lastNoteAt: HOY }), HOY)).toBe(0);
  });

  it('no devuelve negativos con una nota fechada en el futuro', () => {
    expect(daysWithoutNote(persona({ lastNoteAt: '2026-08-20' }), HOY)).toBe(0);
  });
});

describe('needsAttention', () => {
  it('no pide atención mientras queda margen', () => {
    expect(needsAttention(persona({ lastNoteAt: '2026-07-28' }), HOY)).toBe(false);
  });

  it('no pide atención el día exacto en que se agota', () => {
    // 30 días transcurridos con margen 30: el aviso es «más de N» (§5.4).
    expect(needsAttention(persona({ lastNoteAt: '2026-07-05' }), HOY)).toBe(false);
  });

  it('pide atención al día siguiente de agotarse', () => {
    expect(needsAttention(persona({ lastNoteAt: '2026-07-04' }), HOY)).toBe(true);
  });

  it('nunca pide atención con el aviso apagado', () => {
    expect(needsAttention(persona({ lastNoteAt: '2020-01-01', alertAfterDays: null }), HOY)).toBe(
      false,
    );
  });
});

describe('alertRatio', () => {
  it('es la fracción de margen consumida', () => {
    expect(alertRatio(persona({ lastNoteAt: '2026-07-20' }), HOY)).toBeCloseTo(15 / 30);
  });

  it('pasa de uno cuando se ha desbordado', () => {
    expect(alertRatio(persona({ lastNoteAt: '2026-06-01' }), HOY)).toBeGreaterThan(1);
  });

  it('no existe sin margen: la sonda no pinta pista', () => {
    expect(alertRatio(persona({ alertAfterDays: null }), HOY)).toBeNull();
  });
});
