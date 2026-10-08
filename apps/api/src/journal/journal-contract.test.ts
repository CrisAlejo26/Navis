import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    JOURNAL_CONTRACT_ENTRIES,
    JOURNAL_CONTRACT_QUERIES,
    JOURNAL_CONTRACT_UPDATES,
    JOURNAL_SEARCH_CASES,
    createEntrySchema,
    toExcerpt,
} from '@navis/shared';
import { JournalEntry } from './journal-entry.entity';
import { JournalEntryAudio } from './journal-entry-audio.entity';
import { JournalEntriesService, toSearchText } from './journal-entries.service';
import { toEntryView, toListItem } from './journal-entries.mapper';
import { applyFilters, applyOrder } from './journal-filter';
import { JournalStatsService } from './journal-stats.service';

vi.mock('../database/column-types', () => ({
    TIMESTAMP: 'datetime',
    UUID: 'varchar',
    NOW: 'CURRENT_TIMESTAMP',
    isPostgres: false,
}));
describe('contrato compartido del cuaderno — SQLite API', () => {
    const churchId = '9d9e074b-b301-4cc8-b55f-3eb729bd0001';
    let db: DataSource, service: JournalEntriesService, ids: string[];
    beforeAll(async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
        db = await new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [JournalEntry, JournalEntryAudio],
            synchronize: true,
        }).initialize();
        service = new JournalEntriesService(db.getRepository(JournalEntry));
        ids = [];
        for (const input of JOURNAL_CONTRACT_ENTRIES)
            ids.push((await service.create(churchId, createEntrySchema.parse(input), 'owner')).id);
    });
    afterAll(async () => {
        await db.destroy();
        vi.useRealTimers();
    });
    it.each(JOURNAL_CONTRACT_QUERIES)('$name', async ({ query, titles, total }) => {
        const builder = db
            .getRepository(JournalEntry)
            .createQueryBuilder('entry')
            .where('entry.churchId = :churchId', { churchId });
        applyFilters(builder, query, '2026-10-08');
        applyOrder(builder, query.sort ?? 'date', query.order ?? 'desc');
        const limit = query.limit ?? 20;
        const [rows, count] = await builder
            .skip(((query.page ?? 1) - 1) * limit)
            .take(limit)
            .getManyAndCount();
        expect(
            rows.map((row) => toListItem(row, { authorName: null, hasAudio: false }).title),
        ).toEqual(titles);
        expect(count).toBe(total);
    });
    it.each(JOURNAL_SEARCH_CASES)(
        'search index: $title',
        ({ title, annotation, learned, expected }) => {
            expect(toSearchText(title, annotation, learned)).toBe(expected);
        },
    );
    it('preserva día, instante ISO, cuerpo entero y extracto compartido', async () => {
        const entry = await service.require(churchId, ids[0]);
        expect(toEntryView(entry, { authorName: null, audios: [] })).toMatchObject({
            ...JOURNAL_CONTRACT_ENTRIES[0],
            annotation: JOURNAL_CONTRACT_ENTRIES[0].annotation.trim(),
            remindAt: '2099-10-08T17:00:00.000Z',
            remindDoneAt: null,
        });
        expect(toListItem(entry, { authorName: null, hasAudio: false }).excerpt).toBe(
            toExcerpt(JOURNAL_CONTRACT_ENTRIES[0].annotation),
        );
    });
    it('resume los últimos doce meses incluyendo los vacíos', async () => {
        const stats = await new JournalStatsService(db.getRepository(JournalEntry)).stats(churchId);
        expect(stats).toMatchObject({
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
            const entry = toEntryView(await service.update(churchId, ids[0], step.input), {
                authorName: null,
                audios: [],
            });
            expect(entry.remindAt).toBe(step.remindAt);
            expect(Boolean(entry.remindDoneAt)).toBe(step.done);
            expect(entry.remindText).toBe(step.text);
        }
    });
    it('borra entrada y audios en la misma transacción sin afectar otra iglesia', async () => {
        const audios = db.getRepository(JournalEntryAudio);
        await audios.save(
            audios.create({
                churchId,
                entryId: ids[0],
                storageKey: 'retained.m4a',
                mimeType: 'audio/mp4',
                sizeBytes: 20,
                durationSeconds: 12,
                recorded: true,
            }),
        );
        await expect(service.remove('other', ids[0])).rejects.toThrow();
        expect(await audios.count()).toBe(1);
        await service.remove(churchId, ids[0]);
        expect(await audios.count()).toBe(0);
        expect(await audios.count({ withDeleted: true })).toBe(1);
        expect(await db.getRepository(JournalEntry).count()).toBe(5);
    });
});
