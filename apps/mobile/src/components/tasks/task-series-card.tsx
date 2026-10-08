import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { describeTaskRepeat, nextTaskDate, type Task } from '@navis/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDay } from '@/lib/format';
import { listCardShadow } from '@/lib/ui/elevation';
import { hexAlpha } from '@/lib/color';
import { useTaskPalette } from './task-theme';
import { TaskTagBadges } from './task-tag-badges';

export function TaskSeriesCard({
    task,
    today,
    busy,
    edit,
    action,
}: {
    task: Task;
    today: string;
    busy: boolean;
    edit: () => void;
    action: (action: 'pause' | 'resume' | 'finish') => void;
}) {
    const { t, i18n } = useTranslation(),
        p = useTaskPalette();
    const paused = task.repeatPauses?.some((pause) => !pause.to) ?? false;
    const next = nextTaskDate(task, today),
        finished = Boolean(task.repeatStoppedAt) || (!paused && !next);
    return (
        <View
            style={{
                borderRadius: 26,
                padding: 15,
                marginBottom: 14,
                gap: 12,
                backgroundColor: p.card,
                ...listCardShadow(p.primary, p.dark),
            }}
        >
            <Pressable
                onPress={edit}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${t('tasks.edit')} ${task.title}`}
                style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}
            >
                <View
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 15,
                        backgroundColor: hexAlpha(p.primary, 0.14),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="repeat-outline" color={p.primary} size={22} aria-hidden />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                    <Text className="font-sans-semibold text-base text-foreground">
                        {task.title}
                    </Text>
                    <Text className="font-sans text-xs text-muted-foreground">
                        {describeTaskRepeat(task, i18n.language, t)}
                    </Text>
                </View>
            </Pressable>
            <View className="gap-2 flex-row flex-wrap">
                <Badge
                    label={t(
                        finished
                            ? 'tasks.seriesFinished'
                            : paused
                              ? 'tasks.seriesPaused'
                              : 'tasks.seriesActive',
                    )}
                    tone={finished ? 'muted' : paused ? 'warning' : 'primary'}
                />
                <TaskTagBadges tags={task.tags} />
            </View>
            <Text className="font-sans-medium text-sm text-primary">
                {next
                    ? t('tasks.seriesNext', { date: formatDay(next) })
                    : t('tasks.seriesNoneNext')}
            </Text>
            {!finished && (
                <View className="gap-2 flex-row flex-wrap">
                    <Button
                        title={t(paused ? 'tasks.seriesResume' : 'tasks.seriesPause')}
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onPress={() => action(paused ? 'resume' : 'pause')}
                    />
                    <Button
                        title={t('tasks.seriesFinish')}
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onPress={() => action('finish')}
                    />
                </View>
            )}
        </View>
    );
}
