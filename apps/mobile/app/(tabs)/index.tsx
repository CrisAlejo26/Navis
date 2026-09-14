import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { ActivityCard } from '@/components/home/activity-card';
import { DashboardHero } from '@/components/home/dashboard-hero';
import { EventsCard } from '@/components/home/events-card';
import { MetricGrid } from '@/components/home/metric-grid';
import { NotesCard } from '@/components/home/notes-card';
import { TodayTasksCard } from '@/components/home/today-tasks-card';
import { CompositionSection } from '@/components/home/composition-section';
import { Button } from '@/components/ui/button';
import { useDashboardSummary, useRegisteredBelievers } from '@/hooks/use-dashboard';
import { useThemeStore } from '@/lib/theme';

/**
 * El panel de inicio (RFC 0001, rediseño): hero náutico ilustrado arriba —
 * la estampa de la marca, que muda con la hora del saludo — y debajo las
 * mismas métricas de siempre, en paneles redondos sin borde, en una sola
 * columna. Lo calculan los **repositorios** (RFC 0024, Fase 1): hoy sobre la
 * base local del teléfono, mañana sobre la API cuando esté conectada.
 *
 * Cada tarjeta ya navega a su sección al tocarla (creyentes, calendario,
 * tareas): es el acceso rápido que pide la portada, sin duplicar el menú
 * «Más» con una rejilla de atajos aparte.
 */
export default function DashboardScreen() {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const { data, isPending, isError, refetch, isRefetching } = useDashboardSummary();
  const { data: registered } = useRegisteredBelievers();

  // El parallax: el hero se pinta medio desplazado (0.5×) hacia abajo, así
  // que sube a la mitad de velocidad mientras el panel blanco le pasa por
  // encima — la estampa se queda mirando mientras el contenido hace scroll.
  // Se sujeta a cero para que el rebote del «pull to refresh» no descubra un
  // hueco por debajo del mar.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, scrollY.value * 0.5) }],
  }));

  // «Pendiente» cubre también la consulta deshabilitada mientras AsyncStorage
  // hidrata la sesión: no es un error, es «aún no ha empezado». Tratarlo como
  // error pintaba el «Reintentar» un instante en cada arranque.
  if (isPending || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="gap-3 p-6 flex-1 items-center justify-center bg-background">
        <Ionicons name="cloud-offline-outline" size={32} color={palette.mutedForeground} />
        <Text className="text-sm text-center text-muted-foreground">{t('errors.generic')}</Text>
        <Button
          title={t('common.retry')}
          variant="secondary"
          size="sm"
          onPress={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerClassName="min-h-full"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#ffffff"
            progressBackgroundColor={palette.primary}
          />
        }
      >
        <Animated.View style={heroStyle}>
          <DashboardHero
            total={registered ?? data.believers.total}
            newThisMonth={data.believers.newThisMonth}
          />
        </Animated.View>

        <View className="gap-3 -mt-7 px-4 pt-5 pb-10 rounded-t-[28px] bg-background">
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <MetricGrid
              believers={data.believers}
              attention={data.attention}
              streak={data.taskStreak}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <EventsCard events={data.upcomingEvents} palette={palette} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <TodayTasksCard tasks={data.todayTasks} palette={palette} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <NotesCard notes={data.recentNotes} palette={palette} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <ActivityCard weeks={data.weeklyActivity} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <CompositionSection composition={data.composition} />
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
