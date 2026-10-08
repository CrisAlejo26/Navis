import { useState } from 'react';
import type { EntryKind } from '@navis/shared';
import type { LocalJournalEntry } from '@/data/repos/journal-repo';
import type { WriteDreamAudioInput } from '@/data/repos/dream-audios-repo';
import { todayIso } from '@/data/repos/dashboard-repo';

export function localJournalReminder(iso?: string | null): { date: string; time: string } {
    if (!iso) return { date: '', time: '19:00' };
    const d = new Date(iso);
    return {
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
}
export function useJournalDraft(entry?: LocalJournalEntry) {
    const [notificationsDenied, setNotificationsDenied] = useState(false);
    const [title, setTitle] = useState(entry?.title ?? ''),
        [kind, setKind] = useState<EntryKind>(entry?.kind ?? 'observacion');
    const [day, setDay] = useState(entry?.occurredAt ?? todayIso()),
        [annotation, setAnnotation] = useState(entry?.annotation ?? '');
    const [learned, setLearned] = useState(entry?.learned ?? ''),
        [showLearned, setShowLearned] = useState(Boolean(entry?.learned));
    const [reminderOpen, setReminderOpen] = useState(Boolean(entry?.remindAt));
    const [audiosOpen, setAudiosOpen] = useState(Boolean(entry?.audios.length));
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [remindOn, setRemindOn] = useState(Boolean(entry?.remindAt));
    const [reminder, setReminder] = useState(() => localJournalReminder(entry?.remindAt));
    const [remindText, setRemindText] = useState(entry?.remindText ?? '');
    const [pending, setPending] = useState<WriteDreamAudioInput[]>([]),
        [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false),
        [removed, setRemoved] = useState<string[]>([]);
    return {
        notificationsDenied,
        setNotificationsDenied,
        title,
        setTitle,
        kind,
        setKind,
        day,
        setDay,
        annotation,
        setAnnotation,
        learned,
        setLearned,
        showLearned,
        setShowLearned,
        reminderOpen,
        setReminderOpen,
        audiosOpen,
        setAudiosOpen,
        fieldErrors,
        setFieldErrors,
        remindOn,
        setRemindOn,
        reminder,
        setReminder,
        remindText,
        setRemindText,
        pending,
        setPending,
        error,
        setError,
        saving,
        setSaving,
        removed,
        setRemoved,
    };
}
