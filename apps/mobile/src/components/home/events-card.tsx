import { Ionicons } from '@expo/vector-icons';
import type { DashboardEvent } from '@navis/shared';
import { accentHex, type ThemeColors } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { EmptyRow } from '@/components/home/empty-row';
import { TileHeader } from '@/components/home/tile-header';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/** Los próximos eventos del calendario de púlpito (RFC 0001), espejo de la web. */
export function EventsCard({
  events,
  palette,
}: {
  events: readonly DashboardEvent[];
  palette: ThemeColors;
}) {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.resolvedTheme);

  return (
    <Pressable
      onPress={() => router.push('/calendar')}
      className="gap-3 p-4 rounded-xl border border-t-4 border-border border-t-primary bg-card active:opacity-90"
    >
      <TileHeader
        icon="calendar"
        label={t('home.upcomingEvents')}
        tone="primary"
        palette={palette}
      />

      {events.length === 0 ? (
        <EmptyRow icon="calendar-outline" label={t('home.noUpcomingEvents')} palette={palette} />
      ) : (
        <View className="gap-2.5">
          {events.map((event) => (
            <View
              key={`${event.date}-${event.startTime}-${event.name}`}
              className="pl-3 border-l-[3px]"
              style={{ borderLeftColor: accentHex(event.accent, theme) }}
            >
              <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                {event.name}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {formatDay(event.date, 'short')} · {event.startTime} · {event.congregationName}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="gap-1 flex-row items-center self-start">
        <Text className="text-xs font-medium text-primary">{t('home.calendarLink')}</Text>
        <Ionicons name="chevron-forward" size={13} color={palette.primary} />
      </View>
    </Pressable>
  );
}
