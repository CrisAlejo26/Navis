import { useDashboardSummary } from '@navis/api-client';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActivityCard } from '@/components/home/activity-card';
import { CompositionSection } from '@/components/home/composition-section';
import { EventsCard } from '@/components/home/events-card';
import { NotesCard } from '@/components/home/notes-card';
import { StatusCard } from '@/components/home/status-card';
import { TodayTasksCard } from '@/components/home/today-tasks-card';
import { WelcomeHeader } from '@/components/home/welcome-header';
import { api } from '@/lib/api';
import { useThemeStore } from '@/lib/theme';

/**
 * El panel de inicio (RFC 0001): las mismas métricas que la web, con el mismo
 * hook (`useDashboardSummary`, una sola llamada — Regla 1). No lleva la
 * semana de calendario de la web: eso pide su propia rejilla de siete
 * columnas y un `MeetingRibbon`, que es la interfaz del calendario en sí
 * (RFC 0002), todavía puente en móvil.
 *
 * Cada tarjeta ya navega a su sección al tocarla (creyentes, calendario,
 * tareas): es el acceso rápido que pide la portada, sin duplicar el menú
 * «Más» con una rejilla de atajos aparte.
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardSummary(api);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="gap-2 p-6 flex-1 items-center justify-center bg-background">
        <Text className="text-sm text-center text-muted-foreground">{t('errors.generic')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4 pt-16"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={palette.primary}
        />
      }
    >
      <WelcomeHeader />

      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <StatusCard believers={data.believers} attention={data.attention} palette={palette} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <EventsCard events={data.upcomingEvents} palette={palette} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <NotesCard notes={data.recentNotes} palette={palette} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <TodayTasksCard tasks={data.todayTasks} streak={data.taskStreak} palette={palette} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <CompositionSection composition={data.composition} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <ActivityCard weeks={data.weeklyActivity} />
      </Animated.View>
    </ScrollView>
  );
}
