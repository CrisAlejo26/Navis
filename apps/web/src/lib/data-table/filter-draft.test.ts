import { describe, expect, it } from 'vitest';

import { EMPTY_DRAFT, draftFromValue, valueFromDraft } from './filter-draft';
import { datePresetRange, toFilter } from './filter-defaults';

describe('borrador de filtro', () => {
    it('un campo vacío o a medias no es valor todavía', () => {
        expect(valueFromDraft('text', 'contains', EMPTY_DRAFT)).toBeUndefined();
        expect(valueFromDraft('number', 'gt', { ...EMPTY_DRAFT, a: '-' })).toBeUndefined();
        expect(valueFromDraft('select', 'in', EMPTY_DRAFT)).toBeUndefined();
        expect(valueFromDraft('boolean', 'is', EMPTY_DRAFT)).toBeUndefined();
    });

    it('convierte cada tipo en el valor que pide su operador', () => {
        expect(valueFromDraft('text', 'contains', { ...EMPTY_DRAFT, a: ' ana ' })).toBe('ana');
        expect(valueFromDraft('number', 'gt', { ...EMPTY_DRAFT, a: '3.5' })).toBe(3.5);
        expect(valueFromDraft('number', 'between', { ...EMPTY_DRAFT, a: '1', b: '' })).toEqual({
            min: 1,
            max: undefined,
        });
        expect(
            valueFromDraft('date', 'between', { ...EMPTY_DRAFT, a: '2026-09-01', b: '2026-09-30' }),
        ).toEqual({
            from: '2026-09-01',
            to: '2026-09-30',
        });
        expect(valueFromDraft('select', 'in', { ...EMPTY_DRAFT, list: ['a'] })).toEqual(['a']);
        expect(valueFromDraft('boolean', 'is', { ...EMPTY_DRAFT, flag: false })).toBe(false);
    });

    it('ida y vuelta con lo que llega de la URL', () => {
        const value = { min: 2, max: 5 };
        const draft = draftFromValue('number', 'between', value);
        expect(valueFromDraft('number', 'between', draft)).toEqual(value);
        expect(draftFromValue('select', 'in', ['a', 3, 'b']).list).toEqual(['a', 'b']);
    });
});

describe('toFilter', () => {
    it('sin valor no hay filtro, salvo los operadores de vacío', () => {
        expect(toFilter('c', 'contains', undefined)).toBeNull();
        expect(toFilter('c', 'contains', 'x')).toEqual({
            columnId: 'c',
            operator: 'contains',
            value: 'x',
        });
        expect(toFilter('c', 'isEmpty', undefined)).toEqual({ columnId: 'c', operator: 'isEmpty' });
        expect(toFilter('c', 'between', { min: undefined, max: undefined })).toBeNull();
    });
});

describe('atajos de fecha', () => {
    // Regresión de CLAUDE.md (`iso-day`): con los getters UTC, en un huso al este de
    // Greenwich «hoy» saldría el día anterior.
    it('usan los días locales y no se pasan de mes ni de año', () => {
        const now = new Date(2026, 8, 5, 1, 30); // 5 de septiembre, de madrugada
        expect(datePresetRange('today', now)).toEqual({ from: '2026-09-05', to: '2026-09-05' });
        expect(datePresetRange('last7', now)).toEqual({ from: '2026-08-30', to: '2026-09-05' });
        expect(datePresetRange('thisMonth', now)).toEqual({ from: '2026-09-01', to: '2026-09-05' });
        expect(datePresetRange('thisYear', now)).toEqual({ from: '2026-01-01', to: '2026-09-05' });
    });
});
