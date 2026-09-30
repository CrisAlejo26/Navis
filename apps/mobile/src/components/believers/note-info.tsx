import { Ionicons } from '@expo/vector-icons';
import { NOTE_KIND_ACCENTS } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AudioLine } from '@/components/audio-line';
import type { LocalNote } from '@/data/repos/notes-repo';
import { hexAlpha } from '@/lib/color';
import { formatDay, formatMoment } from '@/lib/format';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

/**
 * Lo que dice la nota, entero y por partes: lo que contó, la indicación, el
 * recordatorio, los audios y quién la escribió. Cada bloque va en una tarjeta
 * teñida con el acento del tipo —fondo al 8 %, filo al 30 %—, la misma
 * gramática que la tarjeta de la bitácora, para que la página no quede en
 * blanco y la nota se reconozca de un vistazo.
 */
export function NoteInfo({
    note,
    onDeleteAudio,
}: {
    note: LocalNote;
    onDeleteAudio: (audioId: string) => void;
}) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const accent = NOTE_KIND_ACCENTS[note.kind];

    return (
        <View className="gap-3 px-4">
            <Block accent={accent} label={t('notes.told')}>
                <Text className="text-base leading-relaxed text-foreground">{note.told}</Text>
            </Block>

            {note.advice ? (
                <Block accent={accent} label={t('notes.advice')} icon="bookmark">
                    <Text className="text-base leading-relaxed text-foreground">{note.advice}</Text>
                </Block>
            ) : null}

            {note.remindAt ? (
                <Block accent={accent} label={t('notes.reminderTitle')} icon="notifications">
                    <Text className="text-base font-sans-medium text-foreground">
                        {note.remindDoneAt
                            ? `✓ ${t('notes.reminder.done')}`
                            : t('notes.reminder.pending', {
                                  when: formatMoment(note.remindAt),
                              })}
                    </Text>
                    {note.remindText ? (
                        <Text className="text-sm text-muted-foreground">{note.remindText}</Text>
                    ) : null}
                </Block>
            ) : null}

            {note.audios.map((audio) => (
                <AudioLine key={audio.id} audio={audio} onDelete={() => onDeleteAudio(audio.id)} />
            ))}

            <Text className="text-xs text-center" style={{ color: palette.mutedForeground }}>
                {t('notes.byAuthor', {
                    author: note.authorName ?? t('notes.unknownAuthor'),
                    when: formatDay(note.createdAt.slice(0, 10)),
                })}
            </Text>
        </View>
    );
}

function Block({
    accent,
    label,
    icon,
    children,
}: {
    accent: string;
    label: string;
    icon?: IoniconName;
    children: ReactNode;
}) {
    return (
        <View
            className="gap-2 p-4 rounded-2xl border"
            style={{ backgroundColor: hexAlpha(accent, 0.08), borderColor: hexAlpha(accent, 0.3) }}
        >
            <View className="gap-1.5 flex-row items-center">
                {icon ? <Ionicons name={icon} size={13} color={accent} aria-hidden /> : null}
                <Text
                    className="text-xs tracking-widest font-sans-semibold uppercase"
                    style={{ color: accent }}
                >
                    {label}
                </Text>
            </View>
            {children}
        </View>
    );
}
