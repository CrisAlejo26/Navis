import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useRunningTimer, useStopTimer } from '@/hooks/use-task-time';
import { hexAlpha } from '@/lib/color';
import { RunningClock } from './running-clock';
import { useTaskPalette } from './task-theme';

/**
 * El cronómetro en marcha, arriba de las pantallas de tareas (Fase 7c). Va en
 * el flujo de la pantalla y no fijo abajo: una banda fija se comería la acción
 * principal. Tocarla abre la tarea; no pinta nada si no hay cronómetro.
 */
export function RunningTimerBar() {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        running = useRunningTimer(),
        stop = useStopTimer();
    const timer = running.data;
    if (!timer) return null;
    return (
        <View
            accessibilityRole="summary"
            accessibilityLabel={t('tasks.timerOf', { title: timer.task.title })}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
                padding: 12,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: hexAlpha(p.primary, 0.3),
                backgroundColor: hexAlpha(p.primary, 0.1),
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={timer.task.title}
                onPress={() =>
                    router.push({
                        pathname: '/tasks/detail',
                        params: { kind: 'task', id: timer.task.id },
                    })
                }
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 44,
                }}
            >
                <Ionicons name="timer-outline" size={22} color={p.primary} aria-hidden />
                <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-foreground" numberOfLines={1}>
                        {timer.task.title}
                    </Text>
                    <RunningClock
                        startedAt={timer.entry.startedAt}
                        className="font-sans-medium text-xs text-muted-foreground"
                    />
                </View>
            </Pressable>
            <Button
                title={t('tasks.timeStop')}
                size="sm"
                variant="secondary"
                leadingIcon="stop-outline"
                loading={stop.isPending}
                onPress={() => stop.mutate()}
            />
        </View>
    );
}
