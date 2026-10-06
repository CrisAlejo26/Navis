import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { TaskCardCopy } from './task-card-copy';
import { activityCardSurface } from './task-card-surface';
import { TaskCardIcon } from './task-card-icon';
import { type ActivityItem } from '@/lib/tasks/filters';
import { useTaskPalette, statusKeys } from './task-theme';

export function TaskCard({
    item,
    busy,
    onPress,
    onToggle,
    onDelete,
    onLongPress,
}: {
    item: ActivityItem;
    busy?: boolean;
    onPress: () => void;
    onToggle: () => void;
    onDelete: () => void;
    onLongPress?: () => void;
}) {
    const p = useTaskPalette(),
        { t } = useTranslation(),
        done = item.status === 'completada';
    const surface = activityCardSurface(item, p),
        color = surface.accent;
    return (
        <View style={{ marginBottom: 12 }}>
            <SwipeableRow
                radius={26}
                disabled={busy}
                left={{
                    icon: done ? 'refresh-outline' : 'checkmark',
                    label: t(done ? 'tasks.reopen' : 'tasks.complete'),
                    color: p.success,
                    foreground: p.successForeground,
                    onAction: onToggle,
                }}
                right={{
                    icon: 'trash-outline',
                    label: t('tasks.delete'),
                    color: p.destructive,
                    foreground: p.destructiveForeground,
                    onAction: onDelete,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, ${t(statusKeys[item.status])}`}
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={{
                        borderRadius: 26,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: surface.border,
                        flexDirection: 'row',
                        gap: 13,
                        alignItems: 'center',
                        backgroundColor: surface.background,
                    }}
                >
                    <TaskCardIcon item={item} color={color} />
                    <TaskCardCopy item={item} />
                    {item.time && (
                        <Text
                            className="font-sans-semibold text-xs text-muted-foreground"
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {item.time}
                        </Text>
                    )}
                </Pressable>
            </SwipeableRow>
        </View>
    );
}
