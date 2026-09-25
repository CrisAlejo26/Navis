import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { FilterMenu } from '@/components/tables/filter-menu';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const COLUMNS: CustomTableColumn[] = [
    {
        id: 'c1',
        tableId: 't1',
        key: 'estado',
        label: 'Estado',
        type: 'single_select',
        position: 0,
        required: false,
        options: [{ value: 'nuevo', label: 'Nuevo' }],
        config: null,
        isActive: true,
        believerField: null,
    },
    {
        id: 'c2',
        tableId: 't1',
        key: 'texto',
        label: 'Texto',
        type: 'text',
        position: 1,
        required: false,
        options: null,
        config: null,
        isActive: true,
        believerField: null,
    },
    {
        id: 'c3',
        tableId: 't1',
        key: 'secreto',
        label: 'Secreto',
        type: 'password',
        position: 2,
        required: false,
        options: null,
        config: null,
        isActive: true,
        believerField: null,
    },
];

// Las aserciones comparan textos: el idioma tiene que ser determinista.
beforeAll(() => {
    void i18n.changeLanguage('es');
});

describe('el menú de filtros de la barra', () => {
    it('sin columnas filtrables no se pinta', () => {
        const { container } = renderWithI18n(
            <FilterMenu columns={[{ ...COLUMNS[2] }]} filters={[]} onChange={vi.fn()} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('el gatillo dice cuántos filtros hay activos', () => {
        const filters: RowFilter[] = [{ columnKey: 'texto', operator: 'contains', value: 'x' }];
        renderWithI18n(<FilterMenu columns={COLUMNS} filters={filters} onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Filtro (1)' })).toBeInTheDocument();
    });

    it('lista las columnas y deja añadir un filtro nuevo', () => {
        const onChange = vi.fn();
        renderWithI18n(<FilterMenu columns={COLUMNS} filters={[]} onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Filtro' }));
        fireEvent.click(screen.getByRole('button', { name: /Texto/ }));

        // El control de la columna está abierto dentro del panel.
        expect(screen.getByPlaceholderText('Escribe el texto a buscar')).toBeInTheDocument();
    });

    it('la contraseña no aparece en la lista (D29)', () => {
        renderWithI18n(<FilterMenu columns={COLUMNS} filters={[]} onChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Filtro' }));

        expect(screen.queryByRole('button', { name: /Secreto/ })).not.toBeInTheDocument();
    });

    it('una columna con filtro activo va primero y muestra su resumen', () => {
        const filters: RowFilter[] = [{ columnKey: 'texto', operator: 'contains', value: 'ana' }];
        renderWithI18n(<FilterMenu columns={COLUMNS} filters={filters} onChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Filtro (1)' }));

        const botones = screen.getAllByRole('button');
        const indiceTexto = botones.findIndex((one) => one.textContent?.includes('Texto'));
        const indiceEstado = botones.findIndex((one) => one.textContent?.includes('Estado'));

        expect(indiceTexto).toBeLessThan(indiceEstado);
        expect(screen.getByText(/Contiene «ana»/)).toBeInTheDocument();
    });

    it('se puede volver de la edición a la lista de columnas', () => {
        renderWithI18n(<FilterMenu columns={COLUMNS} filters={[]} onChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Filtro' }));
        fireEvent.click(screen.getByRole('button', { name: /Texto/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Todas las columnas' }));

        expect(screen.getByRole('button', { name: /Estado/ })).toBeInTheDocument();
    });
});
