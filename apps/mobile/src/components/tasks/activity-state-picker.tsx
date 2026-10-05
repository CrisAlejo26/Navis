import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TASK_STATUSES, HABIT_STATUSES, type TaskStatus } from '@navis/shared';
import { Chip } from '@/components/ui/chip';
import { statusKeys } from './task-theme';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function ActivityStatePicker({
    kind,
    value,
    onChange,
    disabled = false,
}: {
    kind: ItemKind;
    value: TaskStatus;
    onChange: (status: TaskStatus) => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-2">
            <Text className="font-sans-medium text-sm text-foreground">{t('tasks.status')}</Text>
            <View className="gap-2 flex-row flex-wrap">
                {(kind === 'task' ? TASK_STATUSES : HABIT_STATUSES).map((status) => (
                    <Chip
                        key={status}
                        label={t(statusKeys[status])}
                        selected={value === status}
                        disabled={disabled}
                        onPress={() => onChange(status)}
                    />
                ))}
            </View>
        </View>
    );
}
