import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { entrySeconds, formatClock, formatDurationShort } from '@navis/shared';
import { Button } from '@/components/ui/button';
import {
    useDeleteTimeEntry,
    useRunningTimer,
    useStartTimer,
    useStopTimer,
    useTaskTime,
} from '@/hooks/use-task-time';
import { ActivityBlock } from './activity-block';
import { RunningClock } from './running-clock';
import { useTaskPalette } from './task-theme';
import { formatDay } from '@/lib/format';

/**
 * El cronómetro de una tarea (Fase 7c): empezar, parar, su total y sus últimas
 * entradas. Solo hay un cronómetro en marcha por persona: empezar aquí detiene
 * el de otra tarea, y el botón lo dice con palabras.
 */
export function TaskTimerControl({ taskId }: { taskId: string }) {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        running = useRunningTimer(),
        time = useTaskTime(taskId),
        start = useStartTimer(),
        stop = useStopTimer(),
        remove = useDeleteTimeEntry();
    const here = running.data?.entry.taskId === taskId ? running.data : null;
    const closed = (time.data?.entries ?? []).filter((entry) => entry.endedAt).slice(0, 5);
    const busy = start.isPending || stop.isPending;
    const confirmDelete = (id: string) =>
        Alert.alert(t('tasks.timeEntryDelete'), undefined, [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('tasks.delete'), style: 'destructive', onPress: () => remove.mutate(id) },
        ]);
    return (
        <ActivityBlock title={t('tasks.timeSection')}>
            <View className="gap-3 flex-row items-center justify-between">
                <View className="gap-1 flex-1">
                    {here ? (
                        <>
                            <Text className="font-sans-medium text-xs text-primary">
                                {t('tasks.timeRunning')}
                            </Text>
                            <RunningClock startedAt={here.entry.startedAt} />
                        </>
                    ) : (
                        <Text className="font-sans-medium text-base text-foreground">
                            {time.data && time.data.totalSeconds > 0
                                ? t('tasks.timeTotal', {
                                      time: formatDurationShort(time.data.totalSeconds),
                                  })
                                : t('tasks.timeNone')}
                        </Text>
                    )}
                </View>
                <Button
                    title={here ? t('tasks.timeStop') : t('tasks.timeStart')}
                    leadingIcon={here ? 'stop-outline' : 'play-outline'}
                    variant={here ? 'secondary' : 'primary'}
                    loading={busy}
                    onPress={() => (here ? stop.mutate() : start.mutate(taskId))}
                />
            </View>
            {closed.map((entry) => (
                <View key={entry.id} className="gap-2 flex-row items-center justify-between">
                    <Text className="font-sans text-xs flex-1 text-muted-foreground">
                        {formatDay(entry.startedAt.slice(0, 10))}
                    </Text>
                    <Text
                        className="font-sans-medium text-sm text-foreground"
                        style={{ fontVariant: ['tabular-nums'] }}
                    >
                        {formatClock(entrySeconds(entry, new Date()))}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('tasks.timeEntryDelete')}
                        hitSlop={10}
                        onPress={() => confirmDelete(entry.id)}
                        style={{
                            minWidth: 44,
                            minHeight: 44,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={18}
                            color={p.mutedForeground}
                            aria-hidden
                        />
                    </Pressable>
                </View>
            ))}
        </ActivityBlock>
    );
}
