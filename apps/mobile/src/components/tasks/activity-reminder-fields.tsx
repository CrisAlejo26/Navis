import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Switch } from '@/components/ui/switch';
import { TaskTagPicker } from './task-tag-picker';
import type { ActivityDraft } from '@/lib/tasks/editor-draft';
export function ActivityReminderFields({
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
                label={t('tasks.reminderEnabled')}
                checked={d.reminderEnabled}
                disabled={busy}
                onChange={(reminderEnabled) => change({ reminderEnabled })}
            />
            {d.reminderEnabled && (
                <>
                    <DatePicker
                        label={t('tasks.reminderAt')}
                        value={d.reminderDate}
                        placeholder={t('tasks.date')}
                        timezone={timezone}
                        disabled={busy}
                        onChange={(reminderDate) => change({ reminderDate })}
                    />
                    <TimePicker
                        label={t('tasks.time')}
                        value={d.reminderTime}
                        disabled={busy}
                        onChange={(reminderTime) => change({ reminderTime })}
                    />
                    <Text className="font-sans text-xs text-muted-foreground">
                        {t('tasks.editor.timezone', { timezone })}
                    </Text>
                    <TaskTagPicker
                        label={t('tasks.editor.reminderTags')}
                        value={d.reminderTagIds}
                        disabled={busy}
                        onChange={(reminderTagIds) => change({ reminderTagIds })}
                    />
                </>
            )}
        </View>
    );
}
