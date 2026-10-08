import { createEntrySchema, type CreateEntryInput } from '@navis/shared';
import type { TFunction } from 'i18next';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import { localJournalReminder, type useJournalDraft } from './journal-draft';

export function validateJournalDraft(
    d: ReturnType<typeof useJournalDraft>,
    entry: LocalJournalEntry | undefined,
    t: TFunction,
): { data: CreateEntryInput; at: string | undefined } | null {
    d.setFieldErrors({});
    const at =
        d.remindOn && d.reminder.date && /^([01]\d|2[0-3]):[0-5]\d$/.test(d.reminder.time)
            ? `${d.reminder.date}T${d.reminder.time}:00`
            : undefined;
    if (d.remindOn && !at) {
        d.setReminderOpen(true);
        d.setFieldErrors({ reminder: t('journal.errorReminderIncomplete') });
        return null;
    }
    const previous = localJournalReminder(entry?.remindAt);
    if (at && at !== `${previous.date}T${previous.time}:00` && new Date(at) <= new Date()) {
        d.setReminderOpen(true);
        d.setFieldErrors({ reminder: t('notes.reminder.inPast') });
        return null;
    }
    const parsed = createEntrySchema.safeParse({
        title: d.title,
        kind: d.kind,
        occurredAt: d.day,
        annotation: d.annotation,
        learned: d.learned || undefined,
        remindAt: at,
        remindText: at ? d.remindText || undefined : undefined,
    });
    if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            const field = String(issue.path[0]);
            const key = field === 'occurredAt' ? 'date' : field === 'remindAt' ? 'reminder' : field;
            errors[key] =
                field === 'title' && !d.title.trim()
                    ? t('journal.errorTitleEmpty')
                    : field === 'annotation' && !d.annotation.trim()
                      ? t('journal.errorAnnotationEmpty')
                      : t('errors.validation');
        }
        d.setFieldErrors(errors);
        return null;
    }
    return { data: parsed.data, at };
}
