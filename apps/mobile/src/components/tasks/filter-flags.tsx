import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import type { TaskFilters } from '@/lib/tasks/filters';
export function FilterFlags({
    draft: f,
    onChange,
}: {
    draft: TaskFilters;
    onChange: (f: TaskFilters) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-4">
            <Text className="font-sans-semibold text-base text-foreground">
                {t('tasks.reminder')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {(['any', 'with', 'without'] as const).map((value) => (
                    <Chip
                        key={value}
                        label={t(
                            value === 'any'
                                ? 'common.all'
                                : value === 'with'
                                  ? 'tasks.filterReminderWith'
                                  : 'tasks.filterReminderWithout',
                        )}
                        selected={(f.reminder ?? 'any') === value}
                        onPress={() =>
                            onChange({ ...f, reminder: value === 'any' ? undefined : value })
                        }
                    />
                ))}
            </View>
            <Text className="font-sans-semibold text-base text-foreground">
                {t('tasks.repeat')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {(['any', 'with', 'without'] as const).map((value) => (
                    <Chip
                        key={value}
                        label={t(
                            value === 'any'
                                ? 'common.all'
                                : value === 'with'
                                  ? 'tasks.mobile.withRepeat'
                                  : 'tasks.mobile.withoutRepeat',
                        )}
                        selected={(f.recurring ?? 'any') === value}
                        onPress={() =>
                            onChange({ ...f, recurring: value === 'any' ? undefined : value })
                        }
                    />
                ))}
            </View>
            <Switch
                label={t('tasks.hideCompleted')}
                checked={f.hideCompleted ?? true}
                onChange={(hideCompleted) => onChange({ ...f, hideCompleted })}
            />
        </View>
    );
}
