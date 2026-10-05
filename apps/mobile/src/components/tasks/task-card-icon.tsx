import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexAlpha, readableAccent } from '@/lib/color';
import { useTaskPalette } from './task-theme';
import { taskIcon } from '@/lib/tasks/icon-map';
import { activityKind, type ActivityItem } from '@/lib/tasks/filters';
export function TaskCardIcon({
    item,
    color,
    size = 42,
}: {
    item: ActivityItem;
    color: string;
    size?: number;
}) {
    const p = useTaskPalette(),
        tag = item.tags[0],
        kind = activityKind(item),
        accent = tag ? p.accent(tag.accent) : color;
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size === 42 ? 15 : 18,
                backgroundColor: hexAlpha(accent, 0.14),
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Ionicons
                name={
                    tag
                        ? taskIcon(tag.icon)
                        : kind === 'habit'
                          ? 'leaf-outline'
                          : 'clipboard-outline'
                }
                size={size === 42 ? 22 : 28}
                color={readableAccent(accent, p.card, p.foreground, 0.14)}
                aria-hidden
            />
        </View>
    );
}
