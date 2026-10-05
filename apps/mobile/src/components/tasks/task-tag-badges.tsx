import { Text, View } from 'react-native';
import type { TagRef } from '@navis/shared';
import { hexAlpha, readableAccent } from '@/lib/color';
import { useTaskPalette } from './task-theme';
export function TaskTagBadges({ tags }: { tags: TagRef[] }) {
    const p = useTaskPalette();
    return (
        <>
            {tags.map((tag) => {
                const accent = p.accent(tag.accent);
                return (
                    <View
                        key={tag.id}
                        style={{
                            borderRadius: 20,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: hexAlpha(accent, 0.12),
                        }}
                    >
                        <Text
                            className="font-sans-medium text-xs"
                            style={{ color: readableAccent(accent, p.card, p.foreground) }}
                        >
                            {tag.name}
                        </Text>
                    </View>
                );
            })}
        </>
    );
}
