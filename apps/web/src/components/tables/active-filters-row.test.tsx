import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { ActiveFiltersRow } from '@/components/tables/active-filters-row';
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
        options: [
            { value: 'nuevo', label: 'Nuevo' },
            { value: 'hecho', label: 'Hecho' },
        ],
        config: null,
        isActive: true,
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
    },
];

const FILTERS: RowFilter[] = [
    { columnKey: 'estado', operator: 'in', value: ['nuevo'] },
    { columnKey: 'texto', operator: 'contains', value: 'ana' },
];

// Las aserciones comparan textos: el idioma tiene que ser determinista.
beforeAll(() => {
    void i18n.changeLanguage('es');
});

describe('la fila de filtros activos', () => {
    it('pinta un chip por filtro, con la columna y su resumen', () => {
        renderWithI18n(<ActiveFiltersRow columns={COLUMNS} filters={FILTERS} onChange={vi.fn()} />);

        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText(/Contiene «ana»/)).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(5); // 2 chips + 2 quitar + quitar todo
    });

    it('sin filtros no pinta nada', () => {
        const { container } = renderWithI18n(
            <ActiveFiltersRow columns={COLUMNS} filters={[]} onChange={vi.fn()} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('la X de un chip quita solo ese filtro', () => {
        const onChange = vi.fn();
        renderWithI18n(
            <ActiveFiltersRow columns={COLUMNS} filters={FILTERS} onChange={onChange} />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Quitar el filtro de Estado' }));

        expect(onChange).toHaveBeenCalledWith([FILTERS[1]]);
    });

    it('«quitar todos» los borra de golpe', () => {
        const onChange = vi.fn();
        renderWithI18n(
            <ActiveFiltersRow columns={COLUMNS} filters={FILTERS} onChange={onChange} />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Quitar los filtros/ }));

        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('tocar el chip reabre el control de esa columna', () => {
        renderWithI18n(<ActiveFiltersRow columns={COLUMNS} filters={FILTERS} onChange={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /^EstadoEs una de/ }));

        // El panel flotante se porta al body: las opciones de la columna están.
        expect(screen.getByRole('dialog', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
    });
});
