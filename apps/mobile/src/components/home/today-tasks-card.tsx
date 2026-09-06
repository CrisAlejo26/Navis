import { Ionicons } from '@expo/vector-icons';
import type { DashboardTask } from '@navis/shared';
import { accentHex, type ThemeColors } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { EmptyRow } from '@/components/home/empty-row';
import { TileHeader } from '@/components/home/tile-header';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

/**
 * Las tareas de hoy, en el panel de inicio (RFC 0018 §9.7). Espejo de
 * `TodayTasksCard` de la web, con la racha en una esquina de la cabecera en
 * vez de a la derecha del título: en un ancho de teléfono no cabían las dos
 * cosas en una sola línea sin recortar el título en alemán (Regla 5 §6).
 */
export function TodayTasksCard({
  tasks,
  streak,
  palette,
}: {
  tasks: readonly DashboardTask[];
  streak: number;
  palette: ThemeColors;
}) {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.resolvedTheme);

  return (
    <Pressable
      onPress={() => router.push('/tasks')}
      className="gap-3 p-5 rounded-xl border border-border bg-card active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <TileHeader
          icon="checkmark-circle"
          label={t('tasks.today')}
          tone="warning"
          palette={palette}
        />
        {streak > 0 && (
          <View
            className="gap-1 px-2 py-1 flex-row items-center rounded-full"
            style={{ backgroundColor: hexAlpha(palette.warning, 0.14) }}
          >
            <Ionicons name="flame" size={12} color={palette.warning} />
            <Text className="text-xs font-semibold" style={{ color: palette.warning }}>
              {t('tasks.streakDays', { count: streak })}
            </Text>
          </View>
        )}
      </View>

      {tasks.length === 0 ? (
        <EmptyRow icon="checkmark-done-outline" label={t('tasks.emptyToday')} palette={palette} />
      ) : (
        <View className="gap-2.5">
          {tasks.map((task) => (
            <View
              key={task.taskId}
              className="pl-3 border-l-[3px]"
              style={{ borderLeftColor: accentHex(task.accent, theme) }}
            >
              <Text
                className="text-sm font-medium text-foreground"
                style={
                  task.completed
                    ? { textDecorationLine: 'line-through', color: palette.mutedForeground }
                    : undefined
                }
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.time && <Text className="text-xs text-muted-foreground">{task.time}</Text>}
            </View>
          ))}
        </View>
      )}

      <View className="gap-1 flex-row items-center self-start">
        <Text className="text-xs font-medium text-primary">{t('tasks.title')}</Text>
        <Ionicons name="chevron-forward" size={13} color={palette.primary} />
      </View>
    </Pressable>
  );
}
