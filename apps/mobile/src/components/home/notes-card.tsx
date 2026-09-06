import { Ionicons } from '@expo/vector-icons';
import { ACCENT_PALETTE, type DashboardNote, type NoteKind } from '@navis/shared';
import type { ThemeColors } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { EmptyRow } from '@/components/home/empty-row';
import { TileHeader } from '@/components/home/tile-header';
import { formatDay } from '@/lib/format';

/**
 * El acento de cada tipo de nota, igual que `NOTE_STYLES` de la web
 * (`lib/believers/note-kinds.ts`) pero solo el color: el icono por tipo es
 * cosa de la bitácora de un creyente, que en móvil todavía es una pantalla
 * puente (RFC 0003). El color sí viaja aquí porque es el mismo dato mirado
 * desde el panel (Regla 9 §7: el color entra por el dato).
 */
const KIND_ACCENT: Record<NoteKind, string> = {
  seguimiento: ACCENT_PALETTE[1] ?? ACCENT_PALETTE[0],
  testimonio: ACCENT_PALETTE[10] ?? ACCENT_PALETTE[0],
  sueno: ACCENT_PALETTE[13] ?? ACCENT_PALETTE[0],
  vision: ACCENT_PALETTE[3] ?? ACCENT_PALETTE[0],
  experiencia: ACCENT_PALETTE[7] ?? ACCENT_PALETTE[0],
  don: ACCENT_PALETTE[4] ?? ACCENT_PALETTE[0],
  correccion: ACCENT_PALETTE[8] ?? ACCENT_PALETTE[0],
};

/** Las últimas entradas de la bitácora, de cualquier persona (RFC 0001). */
export function NotesCard({
  notes,
  palette,
}: {
  notes: readonly DashboardNote[];
  palette: ThemeColors;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push('/believers')}
      className="gap-3 p-4 rounded-xl border border-t-4 border-border border-t-success bg-card active:opacity-90"
    >
      <TileHeader icon="book" label={t('home.recentNotes')} tone="success" palette={palette} />

      {notes.length === 0 ? (
        <EmptyRow icon="book-outline" label={t('home.noRecentNotes')} palette={palette} />
      ) : (
        <View className="gap-2.5">
          {notes.map((note) => (
            <View
              key={note.id}
              className="pl-3 border-l-[3px]"
              style={{ borderLeftColor: KIND_ACCENT[note.kind] }}
            >
              <View className="gap-1.5 flex-row items-baseline">
                <Text className="text-sm font-medium flex-1 text-foreground" numberOfLines={1}>
                  {note.believerName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatDay(note.occurredAt, 'short')}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {note.excerpt}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="gap-1 flex-row items-center self-start">
        <Text className="text-xs font-medium text-primary">{t('home.believersLink')}</Text>
        <Ionicons name="chevron-forward" size={13} color={palette.primary} />
      </View>
    </Pressable>
  );
}
