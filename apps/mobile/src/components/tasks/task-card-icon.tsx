import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexAlpha, readableAccent } from '@/lib/color';
import { useTaskPalette } from './task-theme';
import { taskIcon } from '@/lib/tasks/icon-map';
import { activityKind, type ActivityItem } from '@/lib/tasks/filters';
export function TaskCardIcon({ item, color }: { item: ActivityItem; color: string }) {
    const p = useTaskPalette(),
        tag = item.tags[0],
        kind = activityKind(item);
    return (
        <View
            style={{
                width: 42,
                height: 42,
                borderRadius: 15,
                backgroundColor: hexAlpha(tag?.accent ?? color, 0.14),
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
                size={22}
                color={readableAccent(tag?.accent ?? color, p.card, p.foreground, 0.14)}
                aria-hidden
            />
        </View>
    );
}
