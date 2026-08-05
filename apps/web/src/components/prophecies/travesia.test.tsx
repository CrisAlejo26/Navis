import type { ProphecyListItem } from '@navis/shared';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Travesia } from '@/components/prophecies/travesia';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const HOY = '2026-08-05';

const palabra = (overrides: Partial<ProphecyListItem> = {}): ProphecyListItem => ({
  id: 'p1',
  title: 'La casa junto al río',
  excerpt: 'Vi una casa con el agua cerca',
  receivedAt: '2026-01-01',
  fulfilledAt: null,
  lastFulfillmentAt: null,
  state: 'espera',
  waitingDays: 216,
  fulfillmentsCount: 0,
  fulfillmentDays: [],
  ...overrides,
});

function pintar(items: ProphecyListItem[]) {
  return renderWithI18n(
    <MemoryRouter>
      <Travesia items={items} today={HOY} />
    </MemoryRouter>,
  );
}

describe('la travesía', () => {
  it('pinta un trayecto por palabra, con su enlace a la ficha', () => {
    pintar([palabra(), palabra({ id: 'p2', title: 'El ministerio' })]);

    expect(screen.getByRole('link', { name: 'La casa junto al río' })).toHaveAttribute(
      'href',
      '/prophecies/p1',
    );
    expect(screen.getByRole('link', { name: 'El ministerio' })).toHaveAttribute(
      'href',
      '/prophecies/p2',
    );
  });

  it('la que sigue en espera dice cuánto lleva esperando', () => {
    pintar([palabra({ waitingDays: 216 })]);

    expect(screen.getByText(i18n.t('prophecies.waitingFor', { days: '216' }))).toBeInTheDocument();
  });

  it('la cumplida dice lo que esperó, en pasado', () => {
    pintar([palabra({ state: 'cumplida', fulfilledAt: '2026-06-20', waitingDays: 170 })]);

    expect(screen.getByText(i18n.t('prophecies.waitedFor', { days: '170' }))).toBeInTheDocument();
  });

  it('pone una marca por cada cumplimiento parcial', () => {
    const { container } = pintar([
      palabra({
        state: 'camino',
        lastFulfillmentAt: '2026-05-02',
        fulfillmentsCount: 2,
        fulfillmentDays: ['2026-03-10', '2026-05-02'],
      }),
    ]);

    // Las marcas son los puntos de `bg-primary` sobre el trayecto.
    expect(container.querySelectorAll('.bg-primary.ring-2')).toHaveLength(2);
  });

  it('la cumplida se cierra con un rombo y la abierta no', () => {
    const { container: cerrada } = pintar([
      palabra({ state: 'cumplida', fulfilledAt: '2026-06-20' }),
    ]);
    expect(cerrada.querySelectorAll('.rotate-45')).toHaveLength(1);

    const { container: abierta } = pintar([palabra()]);
    expect(abierta.querySelectorAll('.rotate-45')).toHaveLength(0);
  });

  it('el trazado no se lee: lo que lee un lector de pantalla es el texto', () => {
    const { container } = pintar([palabra({ waitingDays: 216 })]);

    // La pista entera va `aria-hidden` (§7.5).
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(
      screen.getByText(
        i18n.t('prophecies.trackLabel', {
          date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
            new Date('2026-01-01'),
          ),
          state: i18n.t('prophecies.state.espera'),
          days: '216',
        }),
      ),
    ).toBeInTheDocument();
  });

  it('cada estado se distingue sin depender del color: lleva su nombre escrito', () => {
    pintar([
      palabra({ id: 'a', state: 'espera' }),
      palabra({ id: 'b', title: 'B', state: 'camino', lastFulfillmentAt: '2026-05-02' }),
      palabra({ id: 'c', title: 'C', state: 'cumplida', fulfilledAt: '2026-06-20' }),
    ]);

    expect(screen.getAllByText(i18n.t('prophecies.state.espera')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(i18n.t('prophecies.state.camino')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(i18n.t('prophecies.state.cumplida')).length).toBeGreaterThan(0);
  });

  it('rotula el eje con los años del tramo', () => {
    pintar([palabra({ receivedAt: '2024-02-01' })]);

    for (const year of ['2024', '2025', '2026']) {
      expect(screen.getByText(year)).toBeInTheDocument();
    }
  });
});
