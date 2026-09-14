import { Ionicons } from '@expo/vector-icons';
import { NOTE_KIND_ACCENTS, isReminderDue } from '@navis/shared';
import { useAudioPlayer } from 'expo-audio';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { LocalNote } from '@/data/repos/notes-repo';
import { Icon } from '@/components/ui/icon';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';
import { themeColorsHex } from '@navis/theme';

/**
 * Una entrada de la bitácora (§7.5): filete vertical del color del tipo, el
 * tipo en versalitas, lo que contó y **la indicación sangrada debajo** para
 * que se distingan de un vistazo (D15). Después el recordatorio, si lo hay, y
 * los audios con su reproductor.
 */
export function NoteRow({
  note,
  onToggleReminder,
  onDeleteAudio,
}: {
  note: LocalNote;
  onToggleReminder: (note: LocalNote, done: boolean) => void;
  onDeleteAudio: (audioId: string) => void;
}) {
  const { t } = useTranslation();
  const accent = NOTE_KIND_ACCENTS[note.kind];
  const due = isReminderDue(note);

  return (
    <View
      className="gap-1.5 py-3 pl-3"
      style={{ borderLeftWidth: 2, borderLeftColor: accent }}
      accessibilityLabel={`${t(`notes.kinds.${note.kind}`)} · ${formatDay(note.occurredAt, 'short')}`}
    >
      <View className="gap-1.5 flex-row items-center">
        <Text
          className="font-sans-semibold tracking-widest text-[11px] uppercase"
          style={{ color: accent }}
        >
          {t(`notes.kinds.${note.kind}`)}
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          · {formatDay(note.occurredAt, 'short')}
        </Text>
        {note.giftName ? (
          <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
            · {note.giftName}
          </Text>
        ) : null}
      </View>

      <Text className="text-sm leading-relaxed text-foreground">{note.told}</Text>
      {note.advice ? (
        <Text className="pl-3 text-sm leading-relaxed text-muted-foreground">{note.advice}</Text>
      ) : null}

      {note.remindAt && !note.remindDoneAt ? (
        <ReminderLine note={note} due={due} onToggleReminder={onToggleReminder} />
      ) : null}
      {note.remindDoneAt ? (
        <Text className="text-xs text-muted-foreground">✓ {t('notes.reminder.done')}</Text>
      ) : null}

      {note.audios.map((audio) => (
        <AudioLine key={audio.id} audio={audio} onDelete={() => onDeleteAudio(audio.id)} />
      ))}

      <Text className="text-[11px] text-muted-foreground">
        {t('notes.byAuthor', {
          author: note.authorName ?? t('notes.unknownAuthor'),
          when: formatDay(note.createdAt.slice(0, 10), 'short'),
        })}
      </Text>
    </View>
  );
}

function ReminderLine({
  note,
  due,
  onToggleReminder,
}: {
  note: LocalNote;
  due: boolean;
  onToggleReminder: (note: LocalNote, done: boolean) => void;
}) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  return (
    <View className="gap-2 flex-row items-center">
      <Icon name="notifications-outline" size="sm" tone={due ? 'warning' : 'default'} />
      <Text className="text-xs flex-1 text-muted-foreground" numberOfLines={1}>
        {note.remindAt
          ? due && note.remindText
            ? t('notes.reminder.due', { what: note.remindText })
            : t('notes.reminder.pending', { when: formatDay(note.remindAt.slice(0, 10), 'short') })
          : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('notes.reminder.markDone')}
        onPress={() => onToggleReminder(note, true)}
        className="h-8 px-2 items-center justify-center rounded-lg"
        style={{ backgroundColor: hexTint(palette.primary) }}
      >
        <Text className="text-xs font-sans-medium" style={{ color: palette.primary }}>
          {t('notes.reminder.markDone')}
        </Text>
      </Pressable>
    </View>
  );
}

function AudioLine({
  audio,
  onDelete,
}: {
  audio: { uri: string; durationSeconds: number | null; recorded: boolean };
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const player = useAudioPlayer(audio.uri);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }

  return (
    <View className="gap-2 flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.audio.title')}
        onPress={toggle}
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: hexTint(palette.primary) }}
      >
        <Ionicons name={playing ? 'pause' : 'play'} size={14} color={palette.primary} />
      </Pressable>
      <Text className="text-xs flex-1 text-muted-foreground tabular-nums">
        {audio.durationSeconds
          ? `${Math.floor(audio.durationSeconds / 60)}:${String(audio.durationSeconds % 60).padStart(2, '0')}`
          : '—'}
        {audio.recorded ? ` · ${t('common.audio.recorded')}` : ''}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.audio.remove')}
        onPress={onDelete}
        className="h-8 w-8 items-center justify-center rounded-full"
      >
        <Ionicons name="trash-outline" size={14} color={palette.mutedForeground} />
      </Pressable>
    </View>
  );
}

function hexTint(color: string): string {
  return `${color}24`;
}
