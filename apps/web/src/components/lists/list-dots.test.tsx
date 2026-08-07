import { DEFAULT_PUBLIC_FIELDS, type ListSummary } from '@navis/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListDots } from '@/components/lists/list-dots';
import { renderWithI18n as render } from '@/test/render';

const lista = (name: string, index: number): ListSummary => ({
  id: `1111111${String(index)}-1111-4111-8111-111111111111`,
  churchId: '22222222-2222-4222-8222-222222222222',
  name,
  slug: name.toLowerCase(),
  description: null,
  accent: '#2140cf',
  position: index,
  isActive: true,
  visibility: 'private',
  shareToken: null,
  sharedAt: null,
  shareExpiresAt: null,
  publicFields: DEFAULT_PUBLIC_FIELDS,
  allowDownload: true,
  hasCover: false,
  memberCount: 0,
  updatedAt: '2026-08-03T10:00:00.000Z',
  initials: [],
  recentViews: [],
});

const LISTAS = ['Púlpito', 'Recepción', 'Sonido', 'Biblias', 'Ofrenda', 'Retiro'].map(lista);
const idDe = (name: string) => LISTAS.find((one) => one.name === name)?.id ?? '';

describe('los puntos de lista', () => {
  it('no pinta nada cuando esa persona no está en ninguna', () => {
    const { container } = render(<ListDots lists={LISTAS} listIds={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('pinta un punto por lista, con el nombre de cada una a mano', () => {
    render(<ListDots lists={LISTAS} listIds={[idDe('Púlpito'), idDe('Sonido')]} />);

    const grupo = screen.getByLabelText(/Púlpito, Sonido/);
    expect(grupo.querySelectorAll('span[title]')).toHaveLength(2);
  });

  it('corta en cuatro y dice cuántas más hay: cinco puntos dejan de leerse', () => {
    render(<ListDots lists={LISTAS} listIds={LISTAS.map((one) => one.id)} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByLabelText(/Ofrenda/)).toBeInTheDocument();
  });
});
