import { getDb } from '@/data/db';
import { i18n } from '@/lib/i18n';
import { NOTE_REMINDER_CHANNEL } from './setup';
import type { PlannedNotice } from './types';

export async function planJournalReminders(
    userId: string,
    now = new Date(),
): Promise<PlannedNotice[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
        id: string;
        church_id: string;
        title: string;
        remind_at: string;
        remind_text: string | null;
    }>(
        `SELECT e.id, e.church_id, e.title, e.remind_at, e.remind_text FROM journal_entries e
         JOIN churches c ON c.id = e.church_id AND c.deleted_at IS NULL
         WHERE e.deleted_at IS NULL AND e.remind_at IS NOT NULL AND e.remind_done_at IS NULL
         AND (e.author_id = ? OR e.author_id IS NULL)
         AND EXISTS (SELECT 1 FROM church_members m WHERE m.church_id = e.church_id AND m.user_id = ? AND m.deleted_at IS NULL)`,
        userId,
        userId,
    );
    return rows
        .filter((row) => new Date(row.remind_at).getTime() > now.getTime())
        .map((row) => ({
            key: `navis:journal-reminder:${row.id}`,
            fireAt: new Date(row.remind_at),
            title: row.title,
            body: row.remind_text || i18n.t('journal.reminderHint'),
            channelId: NOTE_REMINDER_CHANNEL,
            data: { type: 'journal-reminder', churchId: row.church_id, entryId: row.id },
        }));
}
