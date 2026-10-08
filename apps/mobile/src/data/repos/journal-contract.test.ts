import {
    JOURNAL_CONTRACT_ENTRIES,
    JOURNAL_CONTRACT_QUERIES,
    JOURNAL_CONTRACT_UPDATES,
    JOURNAL_SEARCH_CASES,
    journalSearchText,
    toExcerpt,
} from '@navis/shared';
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import {
    createJournalEntry,
    listJournal,
    findJournalEntry,
    updateJournalEntry,
    journalStats,
} from './journal-repo';
import type { JournalContext } from './journal-repo';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('contrato compartido del cuaderno — SQLite móvil', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>, context: JournalContext, ids: string[];
    beforeAll(async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout'] });
        jest.setSystemTime(new Date('2026-10-08T12:00:00Z'));
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        context = {
            userId: 'owner',
            churchId: (await createChurch({ name: 'Norte', city: 'Elda', ownerId: 'owner' })).id,
        };
        ids = [];
        for (const input of JOURNAL_CONTRACT_ENTRIES)
            ids.push(await createJournalEntry(context, input));
    });
    afterAll(() => {
        db.close();
        jest.useRealTimers();
    });
    it.each(JOURNAL_CONTRACT_QUERIES)('$name', async ({ query, titles, total }) => {
        const page = await listJournal(context, query);
        expect(page.items.map((row) => row.title)).toEqual(titles);
        expect(page.total).toBe(total);
        expect(page.totalPages).toBe(Math.max(1, Math.ceil(total / page.limit)));
    });
    it.each(JOURNAL_SEARCH_CASES)(
        'search index: $title',
        ({ title, annotation, learned, expected }) => {
            expect(journalSearchText(title, annotation, learned)).toBe(expected);
        },
    );
    it('preserva día, instante ISO, cuerpo entero y extracto compartido', async () => {
        const entry = await findJournalEntry(context, ids[0]);
        expect(entry).toMatchObject({
            ...JOURNAL_CONTRACT_ENTRIES[0],
            annotation: JOURNAL_CONTRACT_ENTRIES[0].annotation.trim(),
            remindAt: '2099-10-08T17:00:00.000Z',
            remindDoneAt: null,
        });
        const rows = await listJournal(context, { search: 'ANIMO' });
        expect(rows.items[0].excerpt).toBe(toExcerpt(JOURNAL_CONTRACT_ENTRIES[0].annotation));
    });
    it('resume los últimos doce meses incluyendo los vacíos', async () => {
        expect(await journalStats(context)).toMatchObject({
            total: 6,
            pendingReminders: 1,
            thisMonth: 4,
            monthly: [
                { month: '2025-11', total: 1 },
                { month: '2025-12', total: 0 },
                ...Array.from({ length: 8 }, (_, i) => ({
                    month: `2026-${String(i + 1).padStart(2, '0')}`,
                    total: 0,
                })),
                { month: '2026-09', total: 1 },
                { month: '2026-10', total: 4 },
            ],
        });
    });
    it('atiende, cambia fecha, reabre y elimina el recordatorio', async () => {
        for (const step of JOURNAL_CONTRACT_UPDATES) {
            await updateJournalEntry(context, ids[0], step.input);
            const entry = await findJournalEntry(context, ids[0]);
            expect(entry?.remindAt).toBe(step.remindAt);
            expect(Boolean(entry?.remindDoneAt)).toBe(step.done);
            expect(entry?.remindText).toBe(step.text);
        }
    });
});
