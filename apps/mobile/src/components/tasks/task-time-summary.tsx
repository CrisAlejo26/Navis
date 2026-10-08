import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDurationShort } from '@navis/shared';
import { useTimeSummary } from '@/hooks/use-task-time';
import { hexAlpha, readableAccent } from '@/lib/color';
import { ActivityBlock } from './activity-block';
import { useTaskPalette } from './task-theme';

/**
 * El tiempo trabajado del periodo, por flujo y por tarea (Fase 7c). La barra
 * se anima con `transform` y la duración va escrita: el ancho no es la única
 * forma de leerlo.
 */
export function TaskTimeSummary({ from, to }: { from: string; to: string }) {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        summary = useTimeSummary(from, to);
    const data = summary.data;
    if (!data) return null;
    const max = Math.max(1, ...data.byWorkflow.map((row) => row.seconds));
    return (
        <ActivityBlock title={t('tasks.timeSummary')}>
            {data.totalSeconds === 0 ? (
                <Text className="font-sans text-sm text-muted-foreground">
                    {t('tasks.timeNoSummary')}
                </Text>
            ) : (
                <>
                    <Text className="font-sans-bold text-[32px] text-foreground">
                        {formatDurationShort(data.totalSeconds)}
                    </Text>
                    <Text className="font-sans-semibold text-xs text-muted-foreground">
                        {t('tasks.timeByWorkflow')}
                    </Text>
                    {data.byWorkflow.map((row) => {
                        const accent = p.accent(row.accent ?? 'primary');
                        return (
                            <View key={row.workflowId ?? 'none'} className="gap-1">
                                <View className="flex-row justify-between">
                                    <Text
                                        className="font-sans-medium text-sm flex-1"
                                        style={{
                                            color: readableAccent(accent, p.card, p.foreground),
                                        }}
                                        numberOfLines={1}
                                    >
                                        {row.name ?? t('tasks.timeNoWorkflow')}
                                    </Text>
                                    <Text
                                        className="font-sans text-sm text-muted-foreground"
                                        style={{ fontVariant: ['tabular-nums'] }}
                                    >
                                        {formatDurationShort(row.seconds)}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        height: 8,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        backgroundColor: hexAlpha(accent, 0.14),
                                    }}
                                >
                                    <View
                                        style={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: accent,
                                            transformOrigin: 'left',
                                            transform: [{ scaleX: row.seconds / max }],
                                        }}
                                    />
                                </View>
                            </View>
                        );
                    })}
                    <Text className="font-sans-semibold text-xs text-muted-foreground">
                        {t('tasks.timeByTask')}
                    </Text>
                    {data.byTask.slice(0, 6).map((row) => (
                        <View key={row.taskId} className="gap-2 flex-row justify-between">
                            <Text
                                className="font-sans text-sm flex-1 text-foreground"
                                numberOfLines={1}
                            >
                                {row.title}
                            </Text>
                            <Text
                                className="font-sans text-sm text-muted-foreground"
                                style={{ fontVariant: ['tabular-nums'] }}
                            >
                                {formatDurationShort(row.seconds)}
                            </Text>
                        </View>
                    ))}
                </>
            )}
        </ActivityBlock>
    );
}
