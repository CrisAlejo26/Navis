import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { prophecyFiltersFromLegacy, prophecyRange, toPropheciesQuery } from './prophecies-query';

const base: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

describe('toPropheciesQuery', () => {
    it('sin nada puesto pide por fecha de recepción hacia atrás', () => {
        expect(toPropheciesQuery(base)).toMatchObject({ sort: 'received', order: 'desc' });
    });

    it('lleva estados, el tramo de recepción y el orden pedido', () => {
        const query = toPropheciesQuery({
            ...base,
            sorts: [{ columnId: 'lastMovement', dir: 'asc' }],
            filters: [
                { columnId: 'state', operator: 'in', value: ['espera', 'raro'] },
                { columnId: 'received', operator: 'between', value: { from: '2026-01-01' } },
            ],
        });
        expect(query).toMatchObject({
            sort: 'lastMovement',
            order: 'asc',
            state: ['espera'],
            from: '2026-01-01',
            to: undefined,
        });
    });
});

describe('enlaces de antes', () => {
    const now = new Date(2026, 8, 25);

    it('traduce el estado y el tramo a medida', () => {
        expect(
            prophecyFiltersFromLegacy(
                new URLSearchParams('state=espera&from=2026-02-01&to=2026-03-01'),
                now,
            ),
        ).toEqual([
            { columnId: 'state', operator: 'in', value: ['espera'] },
            {
                columnId: 'received',
                operator: 'between',
                value: { from: '2026-02-01', to: '2026-03-01' },
            },
        ]);
    });

    it('la ventana rápida se convierte en un tramo de fechas del navegador', () => {
        const year = prophecyFiltersFromLegacy(
            new URLSearchParams('state=cumplida&window=year'),
            now,
        );
        expect(prophecyRange(year)).toEqual({ from: '2026-01-01', to: '' });

        const week = prophecyFiltersFromLegacy(new URLSearchParams('window=7d'), now);
        expect(prophecyRange(week).from).toBe('2026-09-19');

        const month = prophecyFiltersFromLegacy(new URLSearchParams('window=30d'), now);
        expect(prophecyRange(month).from).toBe('2026-08-27');
    });

    it('el tramo a medida manda sobre la ventana, y «all» no filtra', () => {
        const custom = prophecyFiltersFromLegacy(
            new URLSearchParams('window=year&from=2025-05-05'),
            now,
        );
        expect(prophecyRange(custom).from).toBe('2025-05-05');
        expect(prophecyFiltersFromLegacy(new URLSearchParams('window=all'), now)).toEqual([]);
    });
});
