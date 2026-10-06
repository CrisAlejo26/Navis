import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTaskTags } from '@/hooks/use-tags';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { useTaskPalette } from './task-theme';
import { taskIcon } from '@/lib/tasks/icon-map';
import { hexAlpha, readableAccent } from '@/lib/color';
import { TaskChipsSkeleton } from './task-loading';
export function TaskTagPicker({
    value,
    onChange,
    disabled = false,
    label,
}: {
    value: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
    label?: string;
}) {
    const tags = useTaskTags(),
        p = useTaskPalette(),
        { t } = useTranslation();
    useEffect(() => {
        if (!tags.data) return;
        const active = value.filter((id) => tags.data.some((tag) => tag.id === id));
        if (active.length !== value.length) onChange(active);
    }, [tags.data, value, onChange]);
    return (
        <View className="gap-3">
            <Text className="font-sans-medium text-sm text-foreground">
                {label ?? t('tasks.tags')}
            </Text>
            {tags.isPending && <TaskChipsSkeleton />}
            <View className="gap-2 flex-row flex-wrap">
                {tags.data?.map((tag) => {
                    const selected = value.includes(tag.id),
                        accent = p.accent(tag.accent),
                        color = readableAccent(accent, p.card, p.foreground);
                    return (
                        <Pressable
                            key={tag.id}
                            accessibilityRole="checkbox"
                            accessibilityLabel={label ? `${label}: ${tag.name}` : tag.name}
                            accessibilityState={{ checked: selected, disabled }}
                            disabled={disabled || (!selected && value.length >= 20)}
                            onPress={() =>
                                onChange(
                                    selected
                                        ? value.filter((id) => id !== tag.id)
                                        : [...value, tag.id],
                                )
                            }
                            style={{
                                minHeight: 44,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                gap: 7,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: 16,
                                backgroundColor: hexAlpha(accent, 0.12),
                                borderWidth: 1.5,
                                borderColor: selected ? p.primary : 'transparent',
                            }}
                        >
                            <Ionicons
                                name={selected ? 'checkmark-circle' : taskIcon(tag.icon)}
                                size={18}
                                color={color}
                                aria-hidden
                            />
                            <Text className="font-sans-medium text-sm" style={{ color }}>
                                {tag.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            {tags.isError ? (
                <>
                    <FieldError message={t('errors.generic')} />
                    <Button
                        variant="link"
                        title={t('common.retry')}
                        onPress={() => void tags.refetch()}
                    />
                </>
            ) : !tags.isPending && !tags.data?.length ? (
                <Text className="font-sans text-sm text-muted-foreground">
                    {t('tasks.mobile.noTags')}
                </Text>
            ) : null}
            <Button
                title={t('tasks.manageTags')}
                variant="link"
                disabled={disabled}
                leadingIcon="pricetags-outline"
                onPress={() => router.push('/tasks/tags')}
            />
        </View>
    );
}
