import type { DashboardAttentionPerson } from '@navis/shared';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { StatusCard } from '@/components/home/status-card';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const persona = (over: Partial<DashboardAttentionPerson>): DashboardAttentionPerson => ({
  id: 'b1',
  name: 'Juan Pérez',
  hasPhoto: false,
  daysWithoutNote: 40,
  ...over,
});

function pintar(attentionPeople: DashboardAttentionPerson[] = [], attentionCount = 0) {
  return renderWithI18n(
    <MemoryRouter>
      <StatusCard
        believers={{ total: 42, newThisMonth: 3 }}
        attention={{ count: attentionCount, people: attentionPeople }}
      />
    </MemoryRouter>,
  );
}

describe('el instrumento de estado de la portada', () => {
  it('junta creyentes y atención en un solo cuadro, cada uno con su enlace', () => {
    pintar();

    expect(screen.getByRole('link', { name: i18n.t('home.believersLink') })).toHaveAttribute(
      'href',
      '/believers',
    );
    expect(screen.getByRole('link', { name: i18n.t('home.attentionLink') })).toHaveAttribute(
      'href',
      '/believers?attention=true',
    );
  });

  it('enseña el total de creyentes y las altas del mes', () => {
    pintar();

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('home.newThisMonth', { count: 3 }))).toBeInTheDocument();
  });

  it('enseña la vista previa de quién pide atención', () => {
    pintar([persona({ name: 'Juan Pérez' }), persona({ id: 'b2', name: 'Ana Ruiz' })], 2);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
  });

  it('con la cuenta a cero no enseña ninguna fila de vista previa', () => {
    pintar([], 0);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
