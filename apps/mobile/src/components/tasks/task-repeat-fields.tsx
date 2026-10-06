import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { DatePicker } from '@/components/ui/date-picker';
import { TASK_REPEAT_END_TYPES } from '@navis/shared';
import type { ActivityDraft } from '@/lib/tasks/editor-draft';
import { TaskRepeatOptionsFields } from './task-repeat-options-fields';

export interface TaskRepeatFieldsProps {
    draft: ActivityDraft;
    change: (patch: Partial<ActivityDraft>) => void;
    timezone: string;
    busy: boolean;
}
export function TaskRepeatFields(props: TaskRepeatFieldsProps) {
    const { draft: d, change, timezone, busy } = props, { t } = useTranslation();
    const endKeys = { nunca: 'tasks.repeatEndNever', fecha: 'tasks.repeatEndDate', cantidad: 'tasks.repeatEndCount' } as const;
    return <View className="gap-4">
        {d.repeatFreq !== 'fechas' && <TextField label={t('tasks.repeatEveryNDays')} value={String(d.repeatInterval)} keyboardType="number-pad" editable={!busy} onChangeText={(value) => change({ repeatInterval: Number(value) })} />}
        <TaskRepeatOptionsFields {...props} />
        <Select label={t('tasks.repeatEnd')} value={d.repeatEndType} disabled={busy} options={TASK_REPEAT_END_TYPES.map((value) => ({ value, label: t(endKeys[value]) }))} onChange={(repeatEndType) => change({ repeatEndType })} placeholder={t('tasks.repeatEndNever')} />
        {d.repeatEndType === 'fecha' && <DatePicker label={t('tasks.repeatEndDate')} placeholder={t('tasks.date')} value={d.repeatEndDate} timezone={timezone} disabled={busy} onChange={(repeatEndDate) => change({ repeatEndDate })} />}
        {d.repeatEndType === 'cantidad' && <TextField label={t('tasks.repeatEndCountLabel')} value={String(d.repeatEndCount)} keyboardType="number-pad" editable={!busy} onChangeText={(value) => change({ repeatEndCount: Number(value) })} />}
    </View>;
}
