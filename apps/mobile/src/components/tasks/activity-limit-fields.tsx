import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Switch } from '@/components/ui/switch';
import type { ActivityDraft } from '@/lib/tasks/editor-draft';

/**
 * El límite de una tarea (Fase 7a): «vence el» y el tiempo máximo mientras
 * está en progreso. Una serie no lo tiene, así que el editor no lo enseña.
 */
export function ActivityLimitFields({
    draft: d,
    change,
    timezone,
    busy,
}: {
    draft: ActivityDraft;
    change: (patch: Partial<ActivityDraft>) => void;
    timezone: string;
    busy: boolean;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-4">
            <Switch
                label={t('tasks.dueDate')}
                checked={d.limitEnabled}
                disabled={busy}
                onChange={(limitEnabled) => change({ limitEnabled })}
            />
            {d.limitEnabled && (
                <DatePicker
                    label={t('tasks.dueDate')}
                    value={d.dueDate}
                    placeholder={t('tasks.date')}
                    timezone={timezone}
                    disabled={busy}
                    onChange={(dueDate) => change({ dueDate })}
                />
            )}
            <Switch
                label={t('tasks.inProgressDeadline')}
                checked={d.deadlineEnabled}
                disabled={busy}
                onChange={(deadlineEnabled) => change({ deadlineEnabled })}
            />
            {d.deadlineEnabled && (
                <>
                    <DatePicker
                        label={t('tasks.inProgressDeadline')}
                        value={d.deadlineDate}
                        placeholder={t('tasks.date')}
                        timezone={timezone}
                        disabled={busy}
                        onChange={(deadlineDate) => change({ deadlineDate })}
                    />
                    <TimePicker
                        label={t('tasks.time')}
                        value={d.deadlineTime}
                        disabled={busy}
                        onChange={(deadlineTime) => change({ deadlineTime })}
                    />
                    <Text className="font-sans text-xs text-muted-foreground">
                        {t('tasks.inProgressDeadlineHint')}
                    </Text>
                </>
            )}
        </View>
    );
}
