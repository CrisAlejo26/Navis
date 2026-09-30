import { Ionicons } from '@expo/vector-icons';
import { NOTE_KIND_ACCENTS } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { LocalNote } from '@/data/repos/notes-repo';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

interface NoteActionsProps {
    note: LocalNote;
    onEdit: () => void;
    onToggleReminder: (done: boolean) => void;
    onDelete: () => void;
}

/**
 * La fila de acciones de la nota, en botones redondeados con su icono y su
 * palabra —la fila de llamar / vídeo / silenciar de un perfil de Telegram—:
 * editar, dar el recordatorio por hecho (solo si lo hay) y borrar. Cada uno
 * mide más de 44 px de alto (Regla 5 §4).
 */
export function NoteActions({ note, onEdit, onToggleReminder, onDelete }: NoteActionsProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const accent = NOTE_KIND_ACCENTS[note.kind];
    const done = note.remindDoneAt !== null;

    return (
        <View className="gap-3 px-4 flex-row">
            <Tile icon="create-outline" label={t('common.edit')} color={accent} onPress={onEdit} />
            {note.remindAt ? (
                <Tile
                    icon={done ? 'notifications-outline' : 'checkmark-done-outline'}
                    label={done ? t('notes.reminder.markPending') : t('notes.reminder.markDone')}
                    color={accent}
                    onPress={() => onToggleReminder(!done)}
                />
            ) : null}
            <Tile
                icon="trash-outline"
                label={t('common.delete')}
                color={palette.destructive}
                onPress={onDelete}
            />
        </View>
    );
}

function Tile({
    icon,
    label,
    color,
    onPress,
}: {
    icon: IoniconName;
    label: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            className="min-h-16 gap-1 px-1 rounded-2xl flex-1 items-center justify-center border"
            style={{ backgroundColor: hexAlpha(color, 0.1), borderColor: hexAlpha(color, 0.3) }}
        >
            <Ionicons name={icon} size={22} color={color} aria-hidden />
            <Text
                className="text-xs font-sans-medium text-center"
                style={{ color }}
                numberOfLines={2}
            >
                {label}
            </Text>
        </Pressable>
    );
}
