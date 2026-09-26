import { describe, expect, it } from 'vitest';

import { legacyWindowStart } from '@/lib/data-table/legacy-window';
import type { TableRequest } from '@/lib/data-table/types';

import { journalFiltersFromLegacy, journalRange, toJournalQuery } from './journal-query';

const base: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

describe('toJournalQuery', () => {
    it('sin nada puesto pide por fecha hacia atrás y sin filtros', () => {
        expect(toJournalQuery(base)).toMatchObject({
            sort: 'date',
            order: 'desc',
            kind: undefined,
            pendingReminder: undefined,
        });
    });

    it('lleva tipos, tramo de fechas, recordatorio pendiente y el primer orden', () => {
        const query = toJournalQuery({
            ...base,
            sorts: [{ columnId: 'kind', dir: 'asc' }],
            filters: [
                { columnId: 'kind', operator: 'in', value: ['oracion', 'raro'] },
                { columnId: 'date', operator: 'between', value: { to: '2026-09-01' } },
                { columnId: 'reminder', operator: 'is', value: true },
            ],
        });
        expect(query).toMatchObject({
            sort: 'kind',
            order: 'asc',
            from: undefined,
            to: '2026-09-01',
            pendingReminder: true,
        });
        expect(query.kind?.length ?? 0).toBeLessThanOrEqual(1);
    });

    it('«recordatorio: no» no filtra (la API solo sabe «pendientes»)', () => {
        expect(
            toJournalQuery({
                ...base,
                filters: [{ columnId: 'reminder', operator: 'is', value: false }],
            }).pendingReminder,
        ).toBeUndefined();
    });
});

describe('enlaces de antes', () => {
    const now = new Date(2026, 8, 25);

    it('traduce recordatorio pendiente y ventana rápida a filtros de la tabla', () => {
        const filters = journalFiltersFromLegacy(
            new URLSearchParams('pendingReminder=true&window=7d'),
            now,
        );
        expect(filters).toContainEqual({ columnId: 'reminder', operator: 'is', value: true });
        expect(journalRange(filters).from).toBe('2026-09-19');
    });

    it('sin parámetros viejos no hay filtros', () => {
        expect(journalFiltersFromLegacy(new URLSearchParams(''), now)).toEqual([]);
    });
});

describe('legacyWindowStart', () => {
    it('calcula el primer día en el calendario de quien mira', () => {
        const now = new Date(2026, 2, 5, 1, 0);
        expect(legacyWindowStart('7d', now)).toBe('2026-02-27');
        expect(legacyWindowStart('30d', now)).toBe('2026-02-04');
        expect(legacyWindowStart('year', now)).toBe('2026-01-01');
        expect(legacyWindowStart('all', now)).toBe('');
        expect(legacyWindowStart('raro', now)).toBe('');
    });
});
