import type { PropheciesStats } from '@navis/shared';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { StatGrid } from '@/components/prophecies/stat-grid';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const stats = (overrides: Partial<PropheciesStats> = {}): PropheciesStats => ({
  total: 47,
  byState: { espera: 22, camino: 9, cumplida: 16 },
  fulfilledThisYear: 5,
  receivedThisYear: 11,
  fulfillmentRate: 0.34,
  medianWaitingDays: 214,
  monthly: Array.from({ length: 12 }, (_, index) => ({
    month: `2026-${String(index + 1).padStart(2, '0')}`,
    received: index,
    fulfilled: index % 3,
  })),
  longestWaiting: { id: 'p9', title: 'El ministerio', waitingDays: 1840 },
  ...overrides,
});

function pintar(data: PropheciesStats) {
  return renderWithI18n(
    <MemoryRouter>
      <StatGrid stats={data} />
    </MemoryRouter>,
  );
}

/** El enlace de una tarjeta, buscándola por su etiqueta. */
const tarjeta = (label: string) => screen.getByRole('link', { name: new RegExp(label, 'i') });

describe('las tarjetas de la portada', () => {
  it('cada una lleva al listado, y no son un número muerto (D10)', () => {
    pintar(stats());

    expect(tarjeta(i18n.t('prophecies.stats.total'))).toHaveAttribute('href', '/prophecies/list');
  });

  it('la de «en espera» abre el listado ya filtrado por ese estado', () => {
    pintar(stats());

    expect(tarjeta(i18n.t('prophecies.stats.waiting'))).toHaveAttribute(
      'href',
      '/prophecies/list?state=espera',
    );
  });

  it('la de «en camino» también lleva su filtro puesto', () => {
    pintar(stats());

    expect(tarjeta(i18n.t('prophecies.stats.onTheWay'))).toHaveAttribute(
      'href',
      '/prophecies/list?state=camino',
    );
  });

  it('la de cumplidas este año lleva estado y ventana de tiempo', () => {
    pintar(stats());

    expect(tarjeta(i18n.t('prophecies.stats.fulfilledThisYear'))).toHaveAttribute(
      'href',
      '/prophecies/list?state=cumplida&window=year',
    );
  });

  it('la de la espera típica ordena por la más antigua primero', () => {
    pintar(stats());

    expect(tarjeta(i18n.t('prophecies.stats.typicalWait'))).toHaveAttribute(
      'href',
      '/prophecies/list?sort=received&order=asc',
    );
  });

  it('enseña las cuentas de cada estado', () => {
    pintar(stats());

    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('la de «en espera» apunta cuál es la que más lleva esperando', () => {
    pintar(stats());

    expect(screen.getByText('El ministerio')).toBeInTheDocument();
  });

  it('sin datos, la espera típica lo dice en vez de enseñar un cero', () => {
    // Cero días y «todavía no hay nada» son cosas distintas (§6.2).
    pintar(stats({ medianWaitingDays: null }));

    expect(screen.getByText(i18n.t('prophecies.stats.noData'))).toBeInTheDocument();
  });

  it('sin tasa que enseñar, lo dice en vez de un 0 %', () => {
    pintar(stats({ fulfillmentRate: null, total: 0 }));

    expect(screen.getByText(i18n.t('prophecies.stats.noRate'))).toBeInTheDocument();
  });
});
