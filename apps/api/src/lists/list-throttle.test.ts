import { beforeEach, describe, expect, it } from 'vitest';

import {
  LIST_TRIES,
  LIST_WINDOW_MS,
  noteTry,
  resetListThrottle,
  retryAfterMs,
} from './list-throttle';

describe('el freno de la puerta', () => {
  beforeEach(() => {
    resetListThrottle();
  });

  it('deja pasar los diez primeros intentos y corta el undécimo', () => {
    const now = 1_000_000;
    for (let vez = 0; vez < LIST_TRIES; vez += 1) {
      expect(retryAfterMs('81.34.12.0|lista', now)).toBe(0);
      noteTry('81.34.12.0|lista', false, now);
    }

    expect(retryAfterMs('81.34.12.0|lista', now)).toBeGreaterThan(0);
    expect(retryAfterMs('81.34.12.0|lista', now)).toBeLessThanOrEqual(LIST_WINDOW_MS);
  });

  it('frena el origen y no la cuenta: desde otro sitio se sigue entrando', () => {
    const now = 1_000_000;
    for (let vez = 0; vez < LIST_TRIES; vez += 1) noteTry('81.34.12.0|lista', false, now);

    expect(retryAfterMs('81.34.12.0|lista', now)).toBeGreaterThan(0);
    expect(retryAfterMs('90.1.2.0|lista', now)).toBe(0);
  });

  it('cuenta por lista: fallar en una no cierra la otra', () => {
    const now = 1_000_000;
    for (let vez = 0; vez < LIST_TRIES; vez += 1) noteTry('81.34.12.0|pulpito', false, now);

    expect(retryAfterMs('81.34.12.0|sonido', now)).toBe(0);
  });

  it('no retarda los dos primeros fallos y sí a partir del tercero', () => {
    const now = 1_000_000;
    expect(noteTry('a', false, now)).toBe(0);
    expect(noteTry('a', false, now)).toBe(0);
    expect(noteTry('a', false, now)).toBeGreaterThan(0);
    expect(noteTry('a', false, now)).toBeGreaterThan(250);
  });

  it('el retardo tiene tope: no se convierte en una denegación de servicio', () => {
    const now = 1_000_000;
    let ultimo = 0;
    for (let vez = 0; vez < 40; vez += 1) ultimo = noteTry('a', false, now);

    expect(ultimo).toBeLessThanOrEqual(2_000);
  });

  it('acertar borra la racha de fallos', () => {
    const now = 1_000_000;
    noteTry('a', false, now);
    noteTry('a', false, now);
    noteTry('a', false, now);
    expect(noteTry('a', true, now)).toBe(0);
    expect(noteTry('a', false, now)).toBe(0);
  });

  it('se olvida al pasar la ventana', () => {
    const now = 1_000_000;
    for (let vez = 0; vez < LIST_TRIES; vez += 1) noteTry('a', false, now);

    expect(retryAfterMs('a', now)).toBeGreaterThan(0);
    expect(retryAfterMs('a', now + LIST_WINDOW_MS + 1)).toBe(0);
  });
});
