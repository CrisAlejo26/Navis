import { View, Text } from 'react-native';
import type { ActivityItem } from '@/lib/tasks/filters';
import { useTaskPalette } from './task-theme';
import { TaskCardChips } from './task-card-chips';
export function TaskCardCopy({ item }: { item: ActivityItem }) {
    const p = useTaskPalette(),
        done = item.status === 'completada';
    return (
        <View style={{ flex: 1, gap: 5 }}>
            <Text
                className="font-sans-semibold text-[15px]"
                style={{
                    color: done ? p.mutedForeground : p.foreground,
                    textDecorationLine: done ? 'line-through' : 'none',
                }}
            >
                {item.title}
            </Text>
            {item.description ? (
                <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={2}>
                    {item.description}
                </Text>
            ) : null}
            <TaskCardChips item={item} />
        </View>
    );
}
