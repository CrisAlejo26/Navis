import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { HabitOccurrence } from '@navis/shared';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TaskCardIcon } from './task-card-icon';
import { TaskTagBadges } from './task-tag-badges';
import { useTaskPalette } from './task-theme';
import { activityCardSurface } from './task-card-surface';

export function HabitTodayCard({
    item,
    busy,
    onPress,
    onToggle,
}: {
    item: HabitOccurrence;
    busy: boolean;
    onPress: () => void;
    onToggle: () => void;
}) {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        done = item.status === 'completada';
    const surface = activityCardSurface(item, p);
    return (
        <View
            style={{
                marginBottom: 13,
                borderRadius: 26,
                padding: 14,
                borderWidth: 1,
                borderColor: surface.border,
                gap: 13,
                backgroundColor: surface.background,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={onPress}
                    style={{ flex: 1, flexDirection: 'row', gap: 13, alignItems: 'center' }}
                >
                    <TaskCardIcon item={item} color={surface.accent} />
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text
                            className="font-sans-semibold text-[15px] text-foreground"
                            style={{ textDecorationLine: done ? 'line-through' : 'none' }}
                        >
                            {item.title}
                        </Text>
                        {!!item.goal && (
                            <Text className="font-sans text-[13px] text-muted-foreground">
                                {item.goal}
                            </Text>
                        )}
                        {!!item.time && (
                            <Text className="font-sans-medium text-xs text-muted-foreground">
                                {item.time}
                            </Text>
                        )}
                    </View>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t(done ? 'tasks.reopen' : 'tasks.complete')}: ${item.title}`}
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={onToggle}
                    style={{
                        minWidth: 48,
                        minHeight: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ProgressRing
                        size={48}
                        strokeWidth={4}
                        progress={done ? 1 : 0}
                        label={done ? '1/1' : '0/1'}
                        tone="success"
                    />
                </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                <Text className="font-sans-medium text-xs text-muted-foreground">
                    {t(done ? 'tasks.statusDone' : 'tasks.statusPending')}
                </Text>
                <TaskTagBadges tags={item.tags} />
            </View>
        </View>
    );
}
