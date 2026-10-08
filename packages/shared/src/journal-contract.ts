import type { CreateEntryInput, UpdateEntryInput } from './schemas/journal';
import type { JournalQuery } from './schemas/journal-queries';

/** Versioned fixtures consumed by both SQLite runners. IDs and write timestamps are generated. */
export const JOURNAL_CONTRACT_TODAY = '2026-10-08';
export const JOURNAL_CONTRACT_ENTRIES: readonly CreateEntryInput[] = [
    {
        title: 'Ánimo para Gómez',
        kind: 'testimonio',
        occurredAt: '2026-10-08',
        annotation: 'Una conversación íntegra '.repeat(20),
        learned: 'Paciencia y oración',
        remindAt: '2099-10-08T19:00:00+02:00',
        remindText: 'Volver a hablar',
    },
    {
        title: 'bien hecho',
        kind: 'bienHecho',
        occurredAt: '2026-10-02',
        annotation: 'El niño aprendió',
    },
    {
        title: 'Decisión 100%_segura',
        kind: 'decision',
        occurredAt: '2026-10-01',
        annotation: 'Un límite literal',
        learned: '',
    },
    {
        title: 'Septiembre',
        kind: 'observacion',
        occurredAt: '2026-09-09',
        annotation: 'Otra visita',
    },
    { title: 'Antigua', kind: 'oracion', occurredAt: '2025-11-20', annotation: 'Una petición' },
    {
        title: 'Futura',
        kind: 'sueno',
        occurredAt: '2026-10-09',
        annotation: 'Todavía no ha pasado',
    },
];
export const JOURNAL_CONTRACT_QUERIES: readonly {
    name: string;
    query: JournalQuery;
    titles: readonly string[];
    total: number;
}[] = [
    {
        name: 'date descending',
        query: {},
        titles: [
            'Futura',
            'Ánimo para Gómez',
            'bien hecho',
            'Decisión 100%_segura',
            'Septiembre',
            'Antigua',
        ],
        total: 6,
    },
    { name: 'accent and case', query: { search: 'ANIMO' }, titles: ['Ánimo para Gómez'], total: 1 },
    { name: 'annotation', query: { search: 'NINO' }, titles: ['bien hecho'], total: 1 },
    { name: 'learned', query: { search: 'ORACION' }, titles: ['Ánimo para Gómez'], total: 1 },
    {
        name: 'literal wildcard',
        query: { search: '%_' },
        titles: ['Decisión 100%_segura'],
        total: 1,
    },
    {
        name: 'seven inclusive days',
        query: { window: '7d' },
        titles: ['Ánimo para Gómez', 'bien hecho'],
        total: 2,
    },
    {
        name: 'thirty inclusive days',
        query: { window: '30d' },
        titles: ['Ánimo para Gómez', 'bien hecho', 'Decisión 100%_segura', 'Septiembre'],
        total: 4,
    },
    {
        name: 'explicit range',
        query: { from: '2026-10-01', to: '2026-10-02' },
        titles: ['bien hecho', 'Decisión 100%_segura'],
        total: 2,
    },
    {
        name: 'kinds',
        query: { kind: ['oracion', 'testimonio'] },
        titles: ['Ánimo para Gómez', 'Antigua'],
        total: 2,
    },
    { name: 'pending', query: { pendingReminder: true }, titles: ['Ánimo para Gómez'], total: 1 },
    {
        name: 'case insensitive title',
        query: { sort: 'title', order: 'asc', limit: 2, page: 2 },
        titles: ['Decisión 100%_segura', 'Futura'],
        total: 6,
    },
];
export const JOURNAL_CONTRACT_UPDATES: readonly {
    input: UpdateEntryInput;
    remindAt: string | null;
    done: boolean;
    text: string | null;
}[] = [
    {
        input: { remindDone: true },
        remindAt: '2099-10-08T17:00:00.000Z',
        done: true,
        text: 'Volver a hablar',
    },
    {
        input: { remindAt: '2099-10-09T19:00:00+02:00' },
        remindAt: '2099-10-09T17:00:00.000Z',
        done: false,
        text: 'Volver a hablar',
    },
    {
        input: { remindDone: true },
        remindAt: '2099-10-09T17:00:00.000Z',
        done: true,
        text: 'Volver a hablar',
    },
    {
        input: { remindDone: false },
        remindAt: '2099-10-09T17:00:00.000Z',
        done: false,
        text: 'Volver a hablar',
    },
    { input: { remindAt: null }, remindAt: null, done: false, text: null },
];
export const JOURNAL_SEARCH_CASES = [
    {
        title: 'ÁRBOL Ñandú',
        annotation: 'ÍNTEGRA',
        learned: 'Oración',
        expected: 'arbol nandu integra oracion',
    },
    { title: 'Título', annotation: 'Texto', learned: null, expected: 'titulo texto' },
    { title: '', annotation: '', learned: '', expected: '' },
] as const;
