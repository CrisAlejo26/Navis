import type { PublicListMember } from '@navis/shared';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicSearchFilters } from '@/components/lists/public-search-filters';
import { i18n } from '@/lib/i18n';
import { usePublicFilter } from '@/lib/lists/use-public-filter';
import { renderWithI18n as render } from '@/test/render';

const persona = (over: Partial<PublicListMember>): PublicListMember => ({
  position: 0,
  name: 'Juan Pérez',
  note: null,
  congregation: null,
  ministry: null,
  arrivedAt: null,
  arrivalSite: null,
  bibleReadings: null,
  vivenciasReadings: null,
  bibleInstituteTimes: null,
  photoId: null,
  ...over,
});

const MIEMBROS: PublicListMember[] = [
  persona({ position: 0, name: 'Juan Pérez', congregation: 'Elda' }),
  persona({ position: 1, name: 'Ana Ruiz', congregation: 'Alicante' }),
  persona({ position: 2, name: 'Jesús Gómez', congregation: 'Elda' }),
];

/**
 * Un arnés mínimo: el hook necesita un componente donde vivir. La búsqueda va
 * por un campo propio y no por `PublicSearchFilters` —que usa `SearchField`
 * con su retardo de siempre— porque aquí se prueba el filtrado de
 * `usePublicFilter`, no ese retardo, que ya es cosa de un componente
 * compartido y probado en otro sitio si hiciera falta.
 */
function Arnes({ members }: { members: PublicListMember[] }) {
  const filter = usePublicFilter(members);

  return (
    <>
      <input
        aria-label="buscar (arnés de prueba)"
        value={filter.search}
        onChange={(event) => {
          filter.setSearch(event.target.value);
        }}
      />
      <PublicSearchFilters state={filter} />
      <p data-testid="resultado">{filter.filtered.map((one) => one.name).join(', ')}</p>
    </>
  );
}

describe('la búsqueda y los filtros de la página pública', () => {
  it('busca sin acentos, como en el resto de la aplicación', () => {
    render(<Arnes members={MIEMBROS} />);

    fireEvent.change(screen.getByLabelText('buscar (arnés de prueba)'), {
      target: { value: 'jesus' },
    });

    expect(screen.getByTestId('resultado')).toHaveTextContent('Jesús Gómez');
  });

  it('solo enseña el filtro de sede si hay más de una sede compartida', () => {
    const { unmount } = render(<Arnes members={MIEMBROS} />);
    expect(screen.getByRole('button', { name: 'Elda' })).toBeInTheDocument();
    unmount();

    render(
      <Arnes members={[persona({ congregation: 'Elda' }), persona({ congregation: 'Elda' })]} />,
    );
    expect(screen.queryByRole('button', { name: 'Elda' })).not.toBeInTheDocument();
  });

  it('filtra por sede al pulsar la pastilla, y se puede apagar otra vez', () => {
    render(<Arnes members={MIEMBROS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Elda' }));
    expect(screen.getByTestId('resultado')).toHaveTextContent('Juan Pérez, Jesús Gómez');

    fireEvent.click(screen.getByRole('button', { name: 'Elda' }));
    expect(screen.getByTestId('resultado')).toHaveTextContent('Juan Pérez, Ana Ruiz, Jesús Gómez');
  });

  it('sin ninguna sede ni labor compartida, no enseña ningún filtro', () => {
    render(<Arnes members={[persona({}), persona({ name: 'Ana Ruiz' })]} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('el buscador de verdad lleva la etiqueta de siempre', () => {
    render(<Arnes members={MIEMBROS} />);
    expect(screen.getByLabelText(i18n.t('lists.searchPeople'))).toBeInTheDocument();
  });
});
