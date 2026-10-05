import {
    ENTRY_KINDS,
    createEntrySchema,
    updateEntrySchema,
    type CreateEntryInput,
    type UpdateEntryInput,
    type EntryKind,
    type JournalEntry,
    type JournalQuery,
    type JournalStats,
    type JournalEntryListItem,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { journalDb, type JournalContext } from './journal-context';
import { todayIso } from './dashboard-repo';
import { journalAudios } from './journal-audios';
export { journalDb, type JournalContext } from './journal-context';

export type LocalJournalEntry = Omit<JournalEntry, 'audios'> & {
    audios: Awaited<ReturnType<typeof journalAudios>>;
};
interface Row {
    id: string;
    church_id: string;
    title: string;
    kind: EntryKind;
    occurred_at: string;
    annotation: string;
    learned: string | null;
    remind_at: string | null;
    remind_text: string | null;
    remind_done_at: string | null;
    author_id: string | null;
    author_name: string | null;
    created_at: string;
}
const columns = 'e.*, u.name AS author_name';
const source = 'journal_entries e LEFT JOIN local_user u ON u.id = e.author_id';
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
const searchText = (title: string, annotation: string, learned: string | null | undefined) =>
    normalize([title, annotation, learned ?? ''].join(' '));

function filters(context: JournalContext, query: JournalQuery) {
    const clauses = ['e.church_id = ?', 'e.deleted_at IS NULL'];
    const params: (string | number)[] = [context.churchId];
    if (query.search?.trim()) {
        clauses.push("e.search_text LIKE ? ESCAPE '\\'");
        params.push(`%${normalize(query.search.trim()).replace(/[\\%_]/g, '\\$&')}%`);
    }
    if (query.kind?.length) {
        clauses.push(`e.kind IN (${query.kind.map(() => '?').join(',')})`);
        params.push(...query.kind);
    }
    const today = todayIso();
    if (query.window && query.window !== 'all') {
        const start = new Date(`${today}T12:00:00`);
        if (query.window === 'year') start.setMonth(0, 1);
        else start.setDate(start.getDate() - (query.window === '7d' ? 6 : 29));
        const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        clauses.push('e.occurred_at >= ? AND e.occurred_at <= ?');
        params.push(day, today);
    }
    if (query.from) {
        clauses.push('e.occurred_at >= ?');
        params.push(query.from);
    }
    if (query.to) {
        clauses.push('e.occurred_at <= ?');
        params.push(query.to);
    }
    if (query.pendingReminder) clauses.push('e.remind_at IS NOT NULL AND e.remind_done_at IS NULL');
    return { where: clauses.join(' AND '), params };
}
export async function listJournal(context: JournalContext, query: JournalQuery) {
    const db = await journalDb(context);
    const { where, params } = filters(context, query);
    const sort = { date: 'e.occurred_at', title: 'e.title COLLATE NOCASE', kind: 'e.kind' }[
        query.sort ?? 'date'
    ];
    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, query.page ?? 1),
        limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const total =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) total FROM ${source} WHERE ${where}`,
                ...params,
            )
        )?.total ?? 0;
    const rows = await db.getAllAsync<Row & { audio_count: number }>(
        `SELECT ${columns}, (SELECT COUNT(*) FROM journal_entry_audios a WHERE a.entry_id = e.id AND a.church_id = e.church_id AND a.deleted_at IS NULL) AS audio_count FROM ${source} WHERE ${where} ORDER BY ${sort} ${order}, e.id ASC LIMIT ? OFFSET ?`,
        ...params,
        limit,
        (page - 1) * limit,
    );
    const items: JournalEntryListItem[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        kind: row.kind,
        occurredAt: row.occurred_at,
        excerpt: row.annotation.slice(0, 240),
        hasLearned: Boolean(row.learned),
        hasAudio: row.audio_count > 0,
        remindAt: row.remind_at,
        remindDoneAt: row.remind_done_at,
        authorName: row.author_name,
    }));
    return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
export async function findJournalEntry(
    context: JournalContext,
    id: string,
): Promise<LocalJournalEntry | null> {
    const db = await journalDb(context);
    const row = await db.getFirstAsync<Row>(
        `SELECT ${columns} FROM ${source} WHERE e.id = ? AND e.church_id = ? AND e.deleted_at IS NULL`,
        id,
        context.churchId,
    );
    if (!row) return null;
    return {
        id: row.id,
        churchId: row.church_id,
        title: row.title,
        kind: row.kind,
        occurredAt: row.occurred_at,
        annotation: row.annotation,
        learned: row.learned,
        remindAt: row.remind_at,
        remindText: row.remind_text,
        remindDoneAt: row.remind_done_at,
        authorId: row.author_id,
        authorName: row.author_name,
        createdAt: row.created_at,
        audios: await journalAudios(db, context.churchId, id),
    };
}
export async function journalStats(context: JournalContext): Promise<JournalStats> {
    const db = await journalDb(context);
    const rows = await db.getAllAsync<{
        kind: EntryKind;
        occurred_at: string;
        remind_at: string | null;
        remind_done_at: string | null;
    }>(
        'SELECT kind, occurred_at, remind_at, remind_done_at FROM journal_entries WHERE church_id = ? AND deleted_at IS NULL',
        context.churchId,
    );
    const today = todayIso(),
        year = today.slice(0, 4);
    const byKind = Object.fromEntries(ENTRY_KINDS.map((kind) => [kind, 0])) as Record<
        EntryKind,
        number
    >;
    for (const row of rows) byKind[row.kind]++;
    return {
        total: rows.length,
        byKind,
        pendingReminders: rows.filter((row) => row.remind_at && !row.remind_done_at).length,
        thisMonth: rows.filter((row) => row.occurred_at.startsWith(today.slice(0, 7))).length,
        monthly: Array.from({ length: 12 }, (_, index) => {
            const month = `${year}-${String(index + 1).padStart(2, '0')}`;
            return { month, total: rows.filter((row) => row.occurred_at.startsWith(month)).length };
        }),
    };
}
export async function createJournalEntry(
    context: JournalContext,
    input: CreateEntryInput,
): Promise<string> {
    const parsed = createEntrySchema.parse(input),
        db = await journalDb(context, true),
        id = newId(),
        now = nowIso();
    await db.runAsync(
        'INSERT INTO journal_entries (id, created_at, updated_at, deleted_at, church_id, title, kind, occurred_at, annotation, learned, remind_at, remind_text, remind_done_at, author_id, search_text) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)',
        id,
        now,
        now,
        context.churchId,
        parsed.title,
        parsed.kind,
        parsed.occurredAt,
        parsed.annotation,
        parsed.learned || null,
        parsed.remindAt ?? null,
        parsed.remindText || null,
        context.userId,
        searchText(parsed.title, parsed.annotation, parsed.learned),
    );
    return id;
}
export async function updateJournalEntry(
    context: JournalContext,
    id: string,
    input: UpdateEntryInput,
): Promise<void> {
    const parsed = updateEntrySchema.parse(input),
        db = await journalDb(context, true, id);
    const current = await findJournalEntry(context, id);
    if (!current) throw new Error('not-found');
    const title = parsed.title ?? current.title,
        annotation = parsed.annotation ?? current.annotation;
    const learned = parsed.learned === undefined ? current.learned : parsed.learned || null;
    const remindAt = parsed.remindAt === undefined ? current.remindAt : parsed.remindAt;
    const remindText = remindAt
        ? parsed.remindText === undefined
            ? current.remindText
            : parsed.remindText || null
        : null;
    const changed = remindAt !== current.remindAt;
    const done =
        !remindAt || changed
            ? null
            : parsed.remindDone === undefined
              ? current.remindDoneAt
              : parsed.remindDone
                ? nowIso()
                : null;
    await db.runAsync(
        'UPDATE journal_entries SET title = ?, kind = ?, occurred_at = ?, annotation = ?, learned = ?, remind_at = ?, remind_text = ?, remind_done_at = ?, search_text = ?, updated_at = ? WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
        title,
        parsed.kind ?? current.kind,
        parsed.occurredAt ?? current.occurredAt,
        annotation,
        learned,
        remindAt,
        remindText,
        done,
        searchText(title, annotation, learned),
        nowIso(),
        id,
        context.churchId,
    );
}
export async function deleteJournalEntry(context: JournalContext, id: string): Promise<void> {
    const db = await journalDb(context, true, id),
        now = nowIso();
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            'UPDATE journal_entry_audios SET deleted_at = ?, updated_at = ? WHERE entry_id = ? AND church_id = ?',
            now,
            now,
            id,
            context.churchId,
        );
        await db.runAsync(
            'UPDATE journal_entries SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
            now,
            now,
            id,
            context.churchId,
        );
    });
}
