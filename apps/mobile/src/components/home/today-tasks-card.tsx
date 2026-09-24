import { Ionicons } from '@expo/vector-icons';
import type { DashboardTask } from '@navis/shared';
import { accentHex, type ThemeColors } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { EmptyRow } from '@/components/home/empty-row';
import { PANEL_SHADOW } from '@/components/home/panel';
import { TileHeader } from '@/components/home/tile-header';
import { useThemeStore } from '@/lib/theme';

/**
 * Las tareas de hoy, en el panel de inicio (RFC 0018 §9.7). Espejo de
 * `TodayTasksCard` de la web. La racha ya vive en la rejilla de métricas
 * (rediseño RFC 0001): aquí queda solo la lista del día.
 */
export function TodayTasksCard({
    tasks,
    palette,
}: {
    tasks: readonly DashboardTask[];
    palette: ThemeColors;
}) {
    const { t } = useTranslation();
    const theme = useThemeStore((state) => state.resolvedTheme);

    return (
        <Pressable
            onPress={() => router.push('/tasks')}
            className="gap-3 p-4 rounded-3xl bg-card active:opacity-90"
            style={PANEL_SHADOW}
        >
            <TileHeader
                icon="checkmark-circle"
                label={t('tasks.today')}
                tone="warning"
                palette={palette}
            />

            {tasks.length === 0 ? (
                <EmptyRow
                    icon="checkmark-done-outline"
                    label={t('tasks.emptyToday')}
                    palette={palette}
                />
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
                                        ? {
                                              textDecorationLine: 'line-through',
                                              color: palette.mutedForeground,
                                          }
                                        : undefined
                                }
                                numberOfLines={1}
                            >
                                {task.title}
                            </Text>
                            {task.time && (
                                <Text className="text-xs text-muted-foreground">{task.time}</Text>
                            )}
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
