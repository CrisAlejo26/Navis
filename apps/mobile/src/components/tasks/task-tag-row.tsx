import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Tag } from '@navis/shared';
import { taskIcon } from '@/lib/tasks/icon-map';
import { hexAlpha, readableAccent } from '@/lib/color';
import { listCardShadow } from '@/lib/ui/elevation';
import { useTaskPalette } from './task-theme';
export function TaskTagRow({ tag }: { tag: Tag }) {
    const p = useTaskPalette(),
        { t } = useTranslation(),
        accent = p.accent(tag.accent);
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.editor.editTagNamed', { name: tag.name })}
            onPress={() => router.push({ pathname: '/tasks/tag-edit', params: { id: tag.id } })}
            style={{
                padding: 15,
                gap: 13,
                borderRadius: 26,
                backgroundColor: p.card,
                flexDirection: 'row',
                alignItems: 'center',
                ...listCardShadow(accent, p.dark),
            }}
        >
            <View
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: 15,
                    backgroundColor: hexAlpha(accent, 0.12),
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons
                    name={taskIcon(tag.icon)}
                    size={22}
                    color={readableAccent(accent, p.card, p.foreground)}
                    aria-hidden
                />
            </View>
            <Text className="font-sans-semibold text-base flex-1 text-foreground">{tag.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={p.mutedForeground} aria-hidden />
        </Pressable>
    );
}
