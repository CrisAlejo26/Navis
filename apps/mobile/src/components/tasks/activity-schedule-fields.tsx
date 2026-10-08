import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { HABIT_REPEAT_FREQS, TASK_REPEAT_FREQS } from '@navis/shared';
import { TaskRepeatFields } from './task-repeat-fields';
import type { ActivityDraft } from '@/lib/tasks/editor-draft';
const repeatKeys = {
    ninguna: 'tasks.repeatNone',
    diaria: 'tasks.repeatDaily',
    semanal: 'tasks.repeatWeekly',
    mensual: 'tasks.repeatMonthly',
    fechas: 'tasks.repeatDates',
} as const;
export function ActivityScheduleFields({
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
            <DatePicker
                label={t('tasks.date')}
                value={d.date}
                placeholder={t('tasks.date')}
                timezone={timezone}
                disabled={busy}
                onChange={(date) => change({ date })}
            />
            <Switch
                label={t('tasks.allDay')}
                checked={d.allDay}
                disabled={busy}
                onChange={(allDay) => change({ allDay })}
            />
            {!d.allDay && (
                <TimePicker
                    label={t('tasks.time')}
                    value={d.time}
                    disabled={busy}
                    onChange={(time) => change({ time })}
                />
            )}
            <Select
                label={t('tasks.repeat')}
                value={d.repeatFreq}
                placeholder={t('tasks.repeatNone')}
                disabled={busy}
                options={(d.kind === 'habit'
                    ? HABIT_REPEAT_FREQS
                    : (['ninguna', ...TASK_REPEAT_FREQS] as const)
                ).map((value) => ({
                    value,
                    label: t(repeatKeys[value]),
                }))}
                onChange={(repeatFreq) =>
                    change({
                        repeatFreq,
                        repeatOptions:
                            repeatFreq === 'fechas' ? { kind: 'dates', dates: [d.date] } : null,
                    })
                }
            />
            {d.kind === 'task' && d.repeatFreq !== 'ninguna' && (
                <TaskRepeatFields draft={d} change={change} timezone={timezone} busy={busy} />
            )}
        </View>
    );
}
