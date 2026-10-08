import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Task } from '@navis/shared';
import { IconButton } from '@/components/ui/icon-button';
import { elevation } from '@/lib/ui/elevation';
import { TaskTagBadges } from './task-tag-badges';
import { useTaskPalette } from './task-theme';
import { activityCardSurface } from './task-card-surface';
import { useTaskOrderDrag } from './use-task-order-drag';
export function TaskOrderRow({
    task,
    index,
    total,
    selected,
    busy,
    select,
    move,
    start,
    drop,
    cancel,
    rowRef,
}: {
    task: Task;
    index: number;
    total: number;
    selected: boolean;
    busy: boolean;
    select: () => void;
    move: (to: number) => void;
    start: () => void;
    drop: (pageY: number) => void;
    cancel: () => void;
    rowRef: (node: View | null) => void;
}) {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        drag = useTaskOrderDrag(start, drop, cancel, busy);
    const surface = activityCardSurface(
        { ...task, taskId: task.id, createdAt: '', status: task.status ?? 'pendiente' },
        p,
    );
    return (
        <View
            ref={rowRef}
            collapsable={false}
            style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 26,
                borderWidth: selected || drag.lifted ? 2 : 1,
                borderColor: selected || drag.lifted ? p.primary : surface.border,
                backgroundColor: surface.background,
                gap: 4,
                transform: [{ translateY: drag.offset }, { scale: drag.lifted ? 1.02 : 1 }],
                zIndex: drag.lifted ? 10 : 0,
                ...(drag.lifted ? elevation('floating', p.primary, p.dark) : {}),
            }}
        >
            <View className="gap-3 flex-row items-center">
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={task.title}
                    onPress={select}
                    disabled={busy}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'center',
                        minHeight: 44,
                    }}
                >
                    <Text
                        className="font-sans-bold text-lg text-center text-primary"
                        style={{ width: 28 }}
                    >
                        {index + 1}
                    </Text>
                    <Text className="font-sans-semibold flex-1 text-[15px] text-foreground">
                        {task.title}
                    </Text>
                </Pressable>
                <View
                    {...drag.handlers}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('tasks.orderDrag')}: ${task.title}`}
                    style={{
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons
                        name="reorder-three-outline"
                        size={26}
                        color={p.mutedForeground}
                        aria-hidden
                    />
                </View>
            </View>
            <View className="flex-row items-center justify-between" style={{ paddingLeft: 40 }}>
                <View className="gap-1 flex-1 flex-row flex-wrap">
                    <TaskTagBadges tags={task.tags} />
                </View>
                <View className="flex-row">
                    <IconButton
                        icon="chevron-up"
                        accessibilityLabel={`${t('tasks.orderUp')}: ${task.title}`}
                        disabled={busy || index === 0}
                        onPress={() => move(index - 1)}
                    />
                    <IconButton
                        icon="chevron-down"
                        accessibilityLabel={`${t('tasks.orderDown')}: ${task.title}`}
                        disabled={busy || index === total - 1}
                        onPress={() => move(index + 1)}
                    />
                </View>
            </View>
        </View>
    );
}
