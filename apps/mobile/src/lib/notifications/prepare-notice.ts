import { assertAccessible } from '@/data/repos/church-access';
import { findBeliever } from '@/data/repos/believers-repo';
import { findNote } from '@/data/repos/notes-repo';
import { findJournalEntry } from '@/data/repos/journal-repo';
import { isOwnActivity } from '@/data/repos/activity-reminders-repo';
import { useLocalSession } from '@/stores/local-session';
import { noticeDataSchema, type NoticeData } from './routes';

/** No cambia contexto por un aviso obsoleto, ajeno o con referencias cruzadas. */
export async function prepareNotice(
    raw: unknown,
    switchChurch: (churchId: string) => Promise<unknown>,
): Promise<{ data: NoticeData; switched: boolean; userId: string } | null> {
    const parsed = noticeDataSchema.safeParse(raw);
    const before = useLocalSession.getState();
    if (!parsed.success || !before.hydrated || !before.session) return null;
    const { data } = parsed;
    const session = before.session;
    await assertAccessible(session.userId, data.churchId);
    if (data.type === 'journal-reminder') {
        const entry = await findJournalEntry(
            { userId: session.userId, churchId: data.churchId },
            data.entryId,
        );
        if (!entry || (entry.authorId && entry.authorId !== session.userId)) return null;
    } else if (data.type === 'activity-reminder') {
        if (!(await isOwnActivity(session.userId, data.churchId, data.kind, data.activityId)))
            return null;
    } else {
        const note = await findNote(data.noteId, data.churchId);
        if (!note || note.believerId !== data.believerId) return null;
        if (note.authorId && note.authorId !== session.userId) return null;
        if (!(await findBeliever(data.believerId, data.churchId))) return null;
    }
    const current = useLocalSession.getState().session;
    if (current?.userId !== session.userId || current.churchId !== session.churchId) return null;
    const switched = session.churchId !== data.churchId;
    if (switched) await switchChurch(data.churchId);
    const after = useLocalSession.getState().session;
    if (after?.userId !== session.userId || after.churchId !== data.churchId) return null;
    return { data, switched, userId: session.userId };
}
