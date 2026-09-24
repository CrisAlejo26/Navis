import type { BelieverNote } from '@navis/shared';
import { NOTE_KINDS } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AudioRecorder } from '@/components/believers/audio-recorder';
import { NOTE_KIND_ICONS } from '@/components/believers/note-kind-icons';
import {
    emptyNoteForm,
    noteFormFrom,
    toNoteInput,
    type NoteFormValues,
} from '@/components/believers/note-form-values';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DatePicker } from '@/components/ui/date-picker';
import { Icon } from '@/components/ui/icon';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { useGifts } from '@/hooks/use-catalog';
import { useThemeStore } from '@/lib/theme';

const KIND_ICONS = NOTE_KIND_ICONS;

interface NoteFormSheetProps {
    visible: boolean;
    onClose: () => void;
    /** La nota que se edita, o `null` para añadir una. */
    note: BelieverNote | null;
    /** Audios grabados mientras el formulario estaba abierto: suben al guardar. */
    pendingAudios: { uri: string; durationSeconds: number | null }[];
    onRecorded: (audio: { uri: string; durationSeconds: number | null }) => void;
    onSave: (values: NoteFormValues) => Promise<void>;
    /** Solo al editar: el borrado es una decisión, no un gesto. */
    onDelete?: () => void;
}

/**
 * Añadir nota (§7.6): el tipo primero —es lo que decide el resto—, la fecha
 * con hoy puesto, lo que contó con el foco, y la indicación opcional debajo.
 * El recordatorio y los audios van plegados porque no siempre hacen falta.
 *
 * El cuerpo se monta con `key` cuando ya hay valores —sin efecto que pise lo
 * que se está escribiendo—, la misma solución que `ProphecyFormBody`.
 */
export function NoteFormSheet(props: NoteFormSheetProps) {
    if (!props.visible) return null;
    return <NoteFormBody key={props.note?.id ?? 'new'} {...props} />;
}

function NoteFormBody({
    onClose,
    note,
    pendingAudios,
    onRecorded,
    onSave,
    onDelete,
}: NoteFormSheetProps) {
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const gifts = useGifts();
    const [values, setValues] = useState<NoteFormValues>(() =>
        note ? noteFormFrom(note) : emptyNoteForm(),
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function save() {
        if (values.told.trim().length === 0) {
            setError(t('notes.told'));
            return;
        }
        const input = toNoteInput(values);
        if (typeof input === 'object' && 'error' in input) {
            setError(t(input.error === 'gift' ? 'notes.giftRequired' : 'notes.reminder.needsWhen'));
            return;
        }
        setSaving(true);
        try {
            await onSave(values);
            onClose();
        } catch {
            setError(t('errors.generic'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <BottomSheet visible onClose={onClose} title={note ? t('notes.edit') : t('notes.add')}>
            <ScrollView
                style={{ maxHeight: height * 0.68 }}
                contentContainerClassName="gap-4"
                showsVerticalScrollIndicator={false}
            >
                <View className="gap-2">
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('notes.kind')}
                    </Text>
                    <View className="gap-2 flex-row flex-wrap">
                        {NOTE_KINDS.map((kind) => (
                            <Chip
                                key={kind}
                                label={t(`notes.kinds.${kind}`)}
                                icon={KIND_ICONS[kind]}
                                selected={values.kind === kind}
                                tone={kind === 'correccion' ? 'destructive' : 'primary'}
                                onPress={() => setValues({ ...values, kind })}
                            />
                        ))}
                    </View>
                </View>

                <DatePicker
                    label={t('notes.date')}
                    value={values.occurredAt}
                    placeholder={t('notes.date')}
                    onChange={(day) => setValues({ ...values, occurredAt: day })}
                />

                <TextField
                    label={t('notes.told')}
                    value={values.told}
                    onChangeText={(text) => setValues({ ...values, told: text })}
                    multiline
                    autoFocus={!note}
                    error={error ?? undefined}
                />
                <TextField
                    label={t('notes.advice')}
                    value={values.advice}
                    onChangeText={(text) => setValues({ ...values, advice: text })}
                    multiline
                    placeholder={t('notes.adviceHint')}
                />

                {values.kind === 'don' ? (
                    <Select
                        label={t('notes.gift')}
                        value={values.giftId ?? ''}
                        placeholder={t('gifts.none')}
                        options={(gifts.data ?? [])
                            .filter((gift) => gift.isActive)
                            .map((gift) => ({ value: gift.id, label: gift.name }))}
                        onChange={(giftId) => setValues({ ...values, giftId: giftId || null })}
                    />
                ) : null}

                <Switch
                    label={t('notes.reminder.toggle')}
                    checked={values.remindOn}
                    onChange={(remindOn) => setValues({ ...values, remindOn })}
                />
                {values.remindOn ? (
                    <View className="gap-3">
                        <DatePicker
                            label={t('notes.reminder.when')}
                            value={values.remindDate}
                            placeholder={t('notes.reminder.when')}
                            onChange={(day) => setValues({ ...values, remindDate: day })}
                        />
                        <View className="gap-2 flex-row items-end">
                            <View className="w-24">
                                <TextField
                                    label={t('notes.reminder.when')}
                                    value={values.remindTime}
                                    onChangeText={(text) =>
                                        setValues({
                                            ...values,
                                            remindTime: text.replaceAll(/[^0-9:]/g, ''),
                                        })
                                    }
                                    placeholder="19:00"
                                />
                            </View>
                            <View className="flex-1">
                                <TextField
                                    label={t('notes.reminder.what')}
                                    value={values.remindText}
                                    onChangeText={(text) =>
                                        setValues({ ...values, remindText: text })
                                    }
                                    placeholder={t('notes.reminder.whatHint')}
                                />
                            </View>
                        </View>
                    </View>
                ) : null}

                {note === null ? (
                    <View className="gap-2">
                        <Text className="text-sm font-sans-medium text-foreground">
                            {t('common.audio.title')}
                        </Text>
                        <AudioRecorder onFinish={onRecorded} />
                        {pendingAudios.map((audio, index) => (
                            <View key={index} className="gap-1 flex-row items-center">
                                <Icon name="mic" size="sm" tone="primary" />
                                <Text className="text-xs text-muted-foreground">
                                    {t('common.audio.count', { total: index + 1 })}
                                    {audio.durationSeconds ? ` · ${audio.durationSeconds}s` : ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </ScrollView>

            <View
                className="gap-2 pt-2"
                style={{ borderTopWidth: 1, borderTopColor: palette.border }}
            >
                <Button title={t('common.save')} loading={saving} onPress={() => void save()} />
                {onDelete ? (
                    <Button
                        title={t('common.delete')}
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                            onClose();
                            onDelete();
                        }}
                    />
                ) : null}
            </View>
        </BottomSheet>
    );
}
