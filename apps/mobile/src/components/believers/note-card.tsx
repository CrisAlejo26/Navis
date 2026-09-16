import { Ionicons } from '@expo/vector-icons';
import { NOTE_KIND_ACCENTS, isReminderDue } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useAudioPlayer } from 'expo-audio';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { LocalNote } from '@/data/repos/notes-repo';
import { NOTE_KIND_ICONS } from '@/components/believers/note-kind-icons';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';
import { hexAlpha } from '@/lib/color';

/**
 * Una nota de la bitácora, **como una tarjetita** — la anatomía de las notas
 * pastorales de Dreamkeeper asimilada al lenguaje de Navis: una pastilla de
 * vidrio tenue arriba dice **el tipo con su icono y su color** (seguimiento,
 * sueño, testimonio… cada tipo el suyo, tomado de `NOTE_KIND_ACCENTS`, la
 * paleta compartida con la web), la fecha y el recordatorio a la derecha, y
 * debajo lo que contó, la indicación en su cajita y los audios.
 *
 * **Toda la tarjeta se tiñe con el color del tipo** — fondo al 8 % y borde
 * al 30 % de su acento, la pastilla un paso más cargada encima (§7.5: el
 * color nunca informa solo, junto a él va siempre el tipo escrito). El
 * cuerpo se recorta a tres líneas — la tarjeta abre el formulario completo
 * al tocarla.
 */
export function NoteCard({
  note,
  onToggleReminder,
  onDeleteAudio,
}: {
  note: LocalNote;
  onToggleReminder: (note: LocalNote, done: boolean) => void;
  onDeleteAudio: (audioId: string) => void;
}) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const accent = NOTE_KIND_ACCENTS[note.kind];
  const due = isReminderDue(note);

  return (
    <View
      className="gap-2 rounded-2xl p-3.5 border bg-card"
      style={{
        backgroundColor: hexAlpha(accent, 0.08),
        borderColor: hexAlpha(accent, 0.3),
      }}
      accessibilityLabel={`${t(`notes.kinds.${note.kind}`)} · ${formatDay(note.occurredAt, 'short')}`}
    >
      <View className="gap-2 flex-row items-center justify-between">
        <View
          className="gap-1.5 flex-row items-center rounded-full"
          style={{
            paddingLeft: 8,
            paddingRight: 10,
            paddingVertical: 3,
            backgroundColor: hexAlpha(accent, 0.12),
          }}
        >
          <Ionicons name={NOTE_KIND_ICONS[note.kind]} size={12} color={accent} aria-hidden />
          <Text className="font-sans-semibold text-[11px]" style={{ color: accent }}>
            {t(`notes.kinds.${note.kind}`)}
          </Text>
          {note.giftName ? (
            <Text
              className="font-sans-medium text-[11px]"
              style={{ color: accent }}
              numberOfLines={1}
            >
              · {note.giftName}
            </Text>
          ) : null}
        </View>
        <View className="gap-1.5 flex-row items-center">
          {note.remindAt && !note.remindDoneAt ? (
            <Ionicons
              name="alarm-outline"
              size={13}
              color={due ? palette.warning : palette.mutedForeground}
              aria-hidden
            />
          ) : null}
          <Text className="text-xs text-muted-foreground tabular-nums">
            {formatDay(note.occurredAt, 'short')}
          </Text>
        </View>
      </View>

      <Text className="text-sm leading-relaxed text-foreground" numberOfLines={3}>
        {note.told}
      </Text>

      {note.advice ? (
        <View
          className="gap-2 p-2.5 flex-row items-start rounded-xl"
          style={{ backgroundColor: hexAlpha(palette.mutedForeground, 0.08) }}
        >
          <Ionicons name="bookmark" size={12} color={palette.mutedForeground} aria-hidden />
          <Text
            className="min-w-0 text-xs leading-relaxed flex-1 text-muted-foreground"
            numberOfLines={2}
          >
            {note.advice}
          </Text>
        </View>
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
      <Ionicons
        name="notifications-outline"
        size={14}
        color={due ? palette.warning : palette.mutedForeground}
        aria-hidden
      />
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
        style={{ backgroundColor: hexAlpha(palette.primary, 0.14) }}
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
        style={{ backgroundColor: hexAlpha(palette.primary, 0.12) }}
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
