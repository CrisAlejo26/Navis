import type { DashboardWeekActivity } from '@navis/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActivityCard } from '@/components/home/activity-card';
import { formatDay } from '@/lib/format';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const SEMANAS: DashboardWeekActivity[] = [
  { week: '2026-06-29', notes: 0 },
  { week: '2026-07-06', notes: 2 },
  { week: '2026-07-13', notes: 0 },
  { week: '2026-07-20', notes: 5 },
  { week: '2026-07-27', notes: 1 },
  { week: '2026-08-03', notes: 3 },
];

describe('la gráfica de actividad semanal de la portada', () => {
  it('suma las notas de las seis semanas para el titular', () => {
    renderWithI18n(<ActivityCard weeks={SEMANAS} />);

    expect(
      screen.getByText(i18n.t('home.weeklyActivityTotal', { count: '11', weeks: 6 })),
    ).toBeInTheDocument();
  });

  it('describe cada semana en la etiqueta accesible, con los ceros incluidos', () => {
    renderWithI18n(<ActivityCard weeks={SEMANAS} />);

    const detalle = SEMANAS.map(
      (one) => `${formatDay(one.week, 'short')}: ${String(one.notes)}`,
    ).join(', ');

    expect(screen.getByRole('img')).toHaveAccessibleName(detalle);
  });

  it('sin ninguna nota en seis semanas, no revienta ni divide por cero', () => {
    renderWithI18n(<ActivityCard weeks={SEMANAS.map((one) => ({ ...one, notes: 0 }))} />);

    expect(
      screen.getByText(i18n.t('home.weeklyActivityTotal', { count: '0', weeks: 6 })),
    ).toBeInTheDocument();
  });

  it('con menos de cuatro semanas con algo escrito, enseña la cifra y no un garabato', () => {
    const pocas = SEMANAS.map((one, index) => ({ ...one, notes: index === 0 ? 4 : 0 }));
    renderWithI18n(<ActivityCard weeks={pocas} />);

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
