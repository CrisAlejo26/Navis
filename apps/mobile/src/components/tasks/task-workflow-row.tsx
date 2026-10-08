import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { WorkflowWithCount } from '@navis/shared';
import { hexAlpha, readableAccent } from '@/lib/color';
import { listCardShadow } from '@/lib/ui/elevation';
import { useTaskPalette } from './task-theme';

export function TaskWorkflowRow({ workflow }: { workflow: WorkflowWithCount }) {
    const p = useTaskPalette(),
        { t } = useTranslation(),
        accent = p.accent(workflow.accent);
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.editor.editWorkflowNamed', { name: workflow.name })}
            onPress={() =>
                router.push({ pathname: '/tasks/workflow-edit', params: { id: workflow.id } })
            }
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
                    name="compass-outline"
                    size={22}
                    color={readableAccent(accent, p.card, p.foreground)}
                    aria-hidden
                />
            </View>
            <View className="gap-1 flex-1">
                <Text className="font-sans-semibold text-base text-foreground">
                    {workflow.name}
                </Text>
                <Text className="font-sans text-xs text-muted-foreground">
                    {t('tasks.workflowTaskCount', { count: workflow.count })}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={p.mutedForeground} aria-hidden />
        </Pressable>
    );
}
