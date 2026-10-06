import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { parseIsoDate } from '@navis/shared';
import { TaskRepeatDates } from './task-repeat-dates';
import type { TaskRepeatFieldsProps } from './task-repeat-fields';

export function TaskRepeatOptionsFields({ draft: d, change, busy, timezone }: TaskRepeatFieldsProps) {
    const { t, i18n } = useTranslation(), options = d.repeatOptions;
    const weekday = parseIsoDate(d.date).getUTCDay();
    const dayOptions = [1, 2, 3, 4, 5, 6, 0].map((value) => ({ value: String(value), label: new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 5, 7 + value))) }));
    if (d.repeatFreq === 'fechas') return <TaskRepeatDates dates={options?.kind === 'dates' ? options.dates : [d.date]} onChange={(dates) => change({ repeatOptions: { kind: 'dates', dates } })} timezone={timezone} busy={busy} anchor={d.date} />;
    if (d.repeatFreq === 'semanal') {
        const selected = options?.kind === 'weekdays' ? options.weekdays : [weekday];
        return <View className="gap-2"><Text className="font-sans-semibold text-sm text-foreground">{t('tasks.repeatWeekdays')}</Text><View className="gap-2 flex-row flex-wrap">{dayOptions.map((day) => <Chip key={day.value} label={day.label} selected={selected.includes(Number(day.value))} disabled={busy} onPress={() => change({ repeatOptions: { kind: 'weekdays', weekdays: selected.includes(Number(day.value)) ? selected.filter((v) => v !== Number(day.value)) : [...selected, Number(day.value)] } })} />)}</View></View>;
    }
    if (d.repeatFreq !== 'mensual') return null;
    const mode = options?.kind === 'monthWeekday' ? 'monthWeekday' : 'monthDay';
    return <View className="gap-4">
        <Select label={t('tasks.repeatMonthMode')} value={mode} disabled={busy} placeholder={t('tasks.repeatMonthDay')} options={['monthDay', 'monthWeekday'].map((value) => ({ value, label: t(value === 'monthDay' ? 'tasks.repeatMonthDay' : 'tasks.repeatMonthWeekday') }))} onChange={(value) => change({ repeatOptions: value === 'monthDay' ? { kind: 'monthDay', day: Number(d.date.slice(8)) } : { kind: 'monthWeekday', week: 1, weekday } })} />
        {mode === 'monthDay' ? <TextField label={t('tasks.repeatDay')} value={String(options?.kind === 'monthDay' ? options.day : Number(d.date.slice(8)))} editable={!busy} keyboardType="number-pad" onChangeText={(value) => change({ repeatOptions: { kind: 'monthDay', day: Number(value) } })} /> : options?.kind === 'monthWeekday' && <>
            <Select label={t('tasks.repeatWeek')} value={String(options.week)} disabled={busy} placeholder="1" options={[1, 2, 3, 4, -1].map((value) => ({ value: String(value), label: value === -1 ? t('tasks.repeatLastWeek') : String(value) }))} onChange={(value) => change({ repeatOptions: { ...options, week: Number(value) } })} />
            <Select label={t('tasks.repeatWeekday')} value={String(options.weekday)} disabled={busy} placeholder={dayOptions[0].label} options={dayOptions} onChange={(value) => change({ repeatOptions: { ...options, weekday: Number(value) } })} />
        </>}
    </View>;
}
