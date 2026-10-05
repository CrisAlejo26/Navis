import { ENTRY_KINDS, createEntrySchema, type EntryKind } from '@navis/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { File } from 'expo-file-system';
import { getDocumentAsync } from 'expo-document-picker';
import { JournalEditor } from './journal-editor';
import { JournalSection } from './journal-section';
import { JournalTime } from './journal-time';
import { TextField } from '@/components/ui/text-field';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { AudioRecorder } from '@/components/believers/audio-recorder';
import {
    createJournalEntry,
    updateJournalEntry,
    type LocalJournalEntry,
} from '@/data/repos/journal-repo';
import { addJournalAudio, deleteJournalAudio } from '@/data/repos/journal-audios';
import { useJournalMutation } from '@/hooks/use-journal';
import { useAfterReminderSaved } from '@/hooks/use-reminder-prompt';
import { todayIso } from '@/data/repos/dashboard-repo';
import { JournalAudio } from './journal-audio';
import { KIND_ICON, useJournalPalette } from './journal-theme';
import type { WriteDreamAudioInput } from '@/data/repos/dream-audios-repo';

function localReminder(iso?: string | null) {
    if (!iso) return { date: '', time: '19:00' };
    const d = new Date(iso);
    return {
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
}
export function JournalForm({
    entry,
    onClose,
}: {
    entry?: LocalJournalEntry;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        p = useJournalPalette();
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
    const [reminder, setReminder] = useState(() => localReminder(entry?.remindAt));
    const [remindText, setRemindText] = useState(entry?.remindText ?? '');
    const [pending, setPending] = useState<WriteDreamAudioInput[]>([]),
        [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false),
        [removed, setRemoved] = useState<string[]>([]);
    const savedId = useRef(entry?.id);
    const deletedAudios = useRef(new Set<string>());
    const create = useJournalMutation(createJournalEntry);
    const update = useJournalMutation(
        (context, input: { id: string; data: Parameters<typeof updateJournalEntry>[2] }) =>
            updateJournalEntry(context, input.id, input.data),
    );
    const addAudio = useJournalMutation(
        (context, input: { id: string; audio: WriteDreamAudioInput }) =>
            addJournalAudio(context, input.id, input.audio),
    );
    const remove = useJournalMutation((context, input: { id: string; audioId: string }) =>
        deleteJournalAudio(context, input.id, input.audioId),
    );
    const afterReminder = useAfterReminderSaved();
    function close() {
        if (saving) return;
        const dirty =
            title !== (entry?.title ?? '') ||
            annotation !== (entry?.annotation ?? '') ||
            learned !== (entry?.learned ?? '') ||
            kind !== (entry?.kind ?? 'observacion') ||
            day !== (entry?.occurredAt ?? todayIso()) ||
            remindOn !== Boolean(entry?.remindAt) ||
            reminder.date !== localReminder(entry?.remindAt).date ||
            reminder.time !== localReminder(entry?.remindAt).time ||
            remindText !== (entry?.remindText ?? '') ||
            pending.length > 0 ||
            removed.length > 0;
        if (!dirty) return onClose();
        Alert.alert(t('journal.mobile.discard'), t('journal.mobile.discardBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('journal.mobile.discard'), style: 'destructive', onPress: onClose },
        ]);
    }
    async function attach() {
        try {
            const picked = await getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
                multiple: true,
            });
            if (!picked.canceled)
                setPending((previous) => [
                    ...previous,
                    ...picked.assets.map((asset) => ({
                        sourceUri: asset.uri,
                        mimeType: asset.mimeType ?? 'audio/mp4',
                        sizeBytes: asset.size ?? 0,
                        durationSeconds: null,
                        recorded: false,
                    })),
                ]);
        } catch {
            setError(t('common.audio.failed'));
        }
    }
    async function save() {
        if (saving) return;
        setFieldErrors({});
        const at =
            remindOn && reminder.date && /^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time)
                ? `${reminder.date}T${reminder.time}:00`
                : undefined;
        if (remindOn && !at) {
            setReminderOpen(true);
            setFieldErrors({ reminder: t('journal.errorReminderIncomplete') });
            return;
        }
        if (
            at &&
            at !==
                (entry?.remindAt
                    ? `${localReminder(entry.remindAt).date}T${localReminder(entry.remindAt).time}:00`
                    : undefined) &&
            new Date(at) <= new Date()
        ) {
            setReminderOpen(true);
            setFieldErrors({ reminder: t('notes.reminder.inPast') });
            return;
        }
        const parsed = createEntrySchema.safeParse({
            title,
            kind,
            occurredAt: day,
            annotation,
            learned: learned || undefined,
            remindAt: at,
            remindText: at ? remindText || undefined : undefined,
        });
        if (!parsed.success) {
            setFieldErrors({
                ...(!title.trim() ? { title: t('journal.errorTitleEmpty') } : {}),
                ...(!annotation.trim() ? { annotation: t('journal.errorAnnotationEmpty') } : {}),
                ...(title.trim() && annotation.trim() ? { date: t('errors.validation') } : {}),
            });
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (savedId.current)
                await update.mutateAsync({
                    id: savedId.current,
                    data: {
                        ...parsed.data,
                        learned: learned || null,
                        remindAt: at ?? null,
                        remindText: at ? remindText || null : null,
                    },
                });
            else savedId.current = await create.mutateAsync(parsed.data);
            for (const audioId of removed) {
                if (deletedAudios.current.has(audioId)) continue;
                await remove.mutateAsync({ id: savedId.current, audioId });
                deletedAudios.current.add(audioId);
            }
            for (const audio of [...pending]) {
                await addAudio.mutateAsync({
                    id: savedId.current,
                    audio: {
                        ...audio,
                        sizeBytes: audio.sizeBytes || new File(audio.sourceUri).size,
                    },
                });
                setPending((previous) => previous.filter((one) => one !== audio));
            }
            if (at) await afterReminder();
            onClose();
        } catch {
            setError(t('errors.generic'));
        } finally {
            setSaving(false);
        }
    }
    return (
        <JournalEditor
            saving={saving}
            onSave={() => void save()}
            onClose={close}
            title={entry ? t('journal.edit') : t('journal.add')}
        >
            <View style={{ gap: 20, paddingBottom: 8 }}>
                <TextField
                    label={t('journal.titleField')}
                    error={fieldErrors.title}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={200}
                    placeholder={t('journal.titlePlaceholder')}
                    autoFocus
                />
                <TextField
                    label={t('journal.annotationField')}
                    error={fieldErrors.annotation}
                    className="min-h-40"
                    value={annotation}
                    onChangeText={setAnnotation}
                    multiline
                    maxLength={8000}
                    placeholder={t('journal.annotationPlaceholder')}
                />
                <View style={{ gap: 8 }}>
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('journal.kindField')}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {ENTRY_KINDS.map((one) => (
                            <Chip
                                color={p.link}
                                key={one}
                                label={t(`journal.kind.${one}`)}
                                icon={KIND_ICON[one]}
                                selected={kind === one}
                                onPress={() => setKind(one)}
                            />
                        ))}
                    </View>
                </View>
                <DatePicker
                    label={t('journal.occurredAtField')}
                    error={fieldErrors.date}
                    value={day}
                    onChange={setDay}
                    placeholder={t('journal.occurredAtField')}
                />
                <JournalSection
                    title={t('journal.learnedField')}
                    icon="bulb-outline"
                    open={showLearned}
                    onToggle={() => setShowLearned(!showLearned)}
                >
                    <TextField
                        label={t('journal.learnedField')}
                        value={learned}
                        onChangeText={setLearned}
                        multiline
                        maxLength={8000}
                        placeholder={t('journal.learnedPlaceholder')}
                    />
                </JournalSection>
                <JournalSection
                    title={t('journal.reminderField')}
                    icon="alarm-outline"
                    open={reminderOpen}
                    onToggle={() => setReminderOpen(!reminderOpen)}
                >
                    <Switch
                        label={t('journal.reminderField')}
                        checked={remindOn}
                        onChange={setRemindOn}
                    />
                    {remindOn && (
                        <View style={{ gap: 12 }}>
                            <DatePicker
                                label={t('journal.reminderDate')}
                                error={fieldErrors.reminder}
                                value={reminder.date}
                                placeholder={t('journal.reminderDate')}
                                onChange={(date) => setReminder({ ...reminder, date })}
                            />
                            <JournalTime
                                value={reminder.time}
                                onChange={(time) => setReminder({ ...reminder, time })}
                            />
                            <TextField
                                label={t('journal.reminderText')}
                                value={remindText}
                                onChangeText={setRemindText}
                                maxLength={500}
                                placeholder={t('journal.reminderTextPlaceholder')}
                            />
                        </View>
                    )}
                </JournalSection>
                <JournalSection
                    title={t('journal.audiosField')}
                    icon="mic-outline"
                    open={audiosOpen}
                    onToggle={() => setAudiosOpen(!audiosOpen)}
                    summary={
                        String((entry?.audios.length ?? 0) - removed.length + pending.length) +
                        ' ' +
                        t('journal.audiosField').toLocaleLowerCase()
                    }
                >
                    {entry?.audios
                        .filter((audio) => !removed.includes(audio.id))
                        .map((audio) => (
                            <JournalAudio
                                key={audio.id}
                                audio={audio}
                                onRemove={() => {
                                    setRemoved((previous) => [...previous, audio.id]);
                                }}
                            />
                        ))}
                    {pending.map((audio, index) => (
                        <JournalAudio
                            key={`${audio.sourceUri}:${index}`}
                            audio={{ uri: audio.sourceUri, durationSeconds: audio.durationSeconds }}
                            onRemove={() =>
                                setPending((previous) => previous.filter((_, i) => i !== index))
                            }
                        />
                    ))}
                    <AudioRecorder
                        onFinish={(audio) =>
                            setPending((previous) => [
                                ...previous,
                                {
                                    sourceUri: audio.uri,
                                    durationSeconds: audio.durationSeconds,
                                    mimeType: 'audio/mp4',
                                    sizeBytes: 0,
                                    recorded: true,
                                },
                            ])
                        }
                    />
                    <Button
                        title={t('journal.attachAudio')}
                        variant="secondary"
                        leadingIcon="attach-outline"
                        onPress={() => void attach()}
                    />
                </JournalSection>
                {error && (
                    <Text accessibilityRole="alert" className="text-sm text-destructive">
                        {error}
                    </Text>
                )}
            </View>
        </JournalEditor>
    );
}
