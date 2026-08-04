import type { AlertState } from '@navis/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sonda } from '@/components/believers/sonda';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const HOY = '2026-08-04';

const persona = (state: Partial<AlertState> = {}): AlertState => ({
  createdAt: '2026-01-10T09:00:00.000Z',
  lastNoteAt: '2026-07-28',
  alertAfterDays: 30,
  ...state,
});

/** La pista va `aria-hidden`: se busca por el relleno, que lleva su marca. */
const relleno = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-sonda="fill"]');

/** Cuánto de la pista se ha llenado, de 0 a 1. */
const lleno = (container: HTMLElement) => relleno(container)?.style.transform;

describe('la sonda', () => {
  it('dentro de margen se llena en proporción y no avisa de nada', () => {
    const { container } = renderWithI18n(<Sonda believer={persona()} today={HOY} />);

    expect(screen.getByText(i18n.t('believers.alert.since', { days: '7' }))).toBeInTheDocument();
    // 7 de 30 días: la pista va llena a la cuarta parte.
    expect(lleno(container)).toBe(`scaleX(${String(7 / 30)})`);
    expect(relleno(container)?.querySelector('.bg-primary')).not.toBeNull();
  });

  it('cerca del límite cambia de tono sin desbordarse', () => {
    const { container } = renderWithI18n(
      <Sonda believer={persona({ lastNoteAt: '2026-07-10' })} today={HOY} />,
    );

    expect(relleno(container)?.querySelector('.bg-warning')).not.toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('desbordada se distingue sin depender del color: icono y texto', () => {
    const { container } = renderWithI18n(
      <Sonda believer={persona({ lastNoteAt: '2026-06-01' })} today={HOY} />,
    );

    // El texto cambia de color, pero además hay un icono y el relleno late.
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(relleno(container)?.querySelector('.animate-latido')).not.toBeNull();
    // Tope al 100 %: no se sale de la pista.
    expect(lleno(container)).toBe('scaleX(1)');
  });

  it('sin ninguna nota lo dice, y la pista se queda vacía', () => {
    const { container } = renderWithI18n(
      <Sonda
        believer={persona({ lastNoteAt: null, createdAt: '2026-08-01T00:00:00.000Z' })}
        today={HOY}
      />,
    );

    expect(screen.getByText(i18n.t('believers.alert.never'))).toBeInTheDocument();
    expect(lleno(container)).toBe('scaleX(0)');
  });

  it('con el aviso apagado no pinta pista, solo los días', () => {
    const { container } = renderWithI18n(
      <Sonda believer={persona({ alertAfterDays: null })} today={HOY} />,
    );

    expect(screen.getByText(i18n.t('believers.alert.since', { days: '7' }))).toBeInTheDocument();
    expect(relleno(container)).toBeNull();
  });

  it('cuenta desde el alta cuando todavía no hay ninguna nota', () => {
    const { container } = renderWithI18n(
      <Sonda
        believer={persona({ lastNoteAt: null, createdAt: '2026-05-01T00:00:00.000Z' })}
        today={HOY}
      />,
    );

    // 95 días desde el alta con margen 30: pide atención, y lo dice con icono.
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('believers.alert.readerNever', { margin: '30' })),
    ).toBeInTheDocument();
  });
});
