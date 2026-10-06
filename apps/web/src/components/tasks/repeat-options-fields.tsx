import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { RepeatDraft } from './repeat-fields';

export function RepeatOptionsFields({ value: v, onChange }: { value: RepeatDraft; onChange: (next: RepeatDraft) => void }) {
    const { t, i18n } = useTranslation(), [date, setDate] = useState('');
    const options = v.options;
    const days = [1, 2, 3, 4, 5, 6, 0].map((day) => ({ day, label: new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 5, 7 + day))) }));
    if (v.freq === 'semanal') {
        const selected = options?.kind === 'weekdays' ? options.weekdays : [];
        return <fieldset className="gap-2 flex flex-wrap"><legend className="mb-2 text-sm font-medium">{t('tasks.repeatWeekdays')}</legend>{days.map(({ day, label }) => <Button key={day} type="button" variant={selected.includes(day) ? 'primary' : 'outline'} size="sm" aria-pressed={selected.includes(day)} onClick={() => onChange({ ...v, options: { kind: 'weekdays', weekdays: selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day] } })}>{label}</Button>)}</fieldset>;
    }
    if (v.freq === 'fechas') {
        const dates = options?.kind === 'dates' ? options.dates : [];
        return <div className="gap-3 flex flex-col"><p className="text-sm text-muted-foreground">{t('tasks.repeatDatesHelp')}</p><Input type="date" label={t('tasks.date')} value={date} onChange={(event) => setDate(event.target.value)} /><Button type="button" variant="outline" disabled={!date || dates.includes(date) || dates.length >= 999} onClick={() => onChange({ ...v, options: { kind: 'dates', dates: [...dates, date].sort() } })}>{t('tasks.repeatDates')}</Button><div className="gap-2 flex flex-wrap">{dates.map((day) => <Button type="button" size="sm" variant="outline" key={day} aria-label={`${t('tasks.delete')} ${day}`} onClick={() => onChange({ ...v, options: { kind: 'dates', dates: dates.filter((d) => d !== day) } })}>{day} ×</Button>)}</div></div>;
    }
    if (v.freq !== 'mensual') return null;
    const mode = options?.kind === 'monthWeekday' ? 'monthWeekday' : 'monthDay';
    return <div className="gap-3 flex flex-col">
        <Select label={t('tasks.repeatMonthMode')} value={mode} onChange={(event) => onChange({ ...v, options: event.target.value === 'monthDay' ? { kind: 'monthDay', day: 1 } : { kind: 'monthWeekday', week: 1, weekday: 1 } })}><option value="monthDay">{t('tasks.repeatMonthDay')}</option><option value="monthWeekday">{t('tasks.repeatMonthWeekday')}</option></Select>
        {mode === 'monthDay' ? <Input type="number" min={1} max={31} label={t('tasks.repeatDay')} value={options?.kind === 'monthDay' ? options.day : ''} onChange={(event) => onChange({ ...v, options: { kind: 'monthDay', day: Number(event.target.value) } })} /> : options?.kind === 'monthWeekday' && <>
            <Select label={t('tasks.repeatWeek')} value={options.week} onChange={(event) => onChange({ ...v, options: { ...options, week: Number(event.target.value) } })}>{[1, 2, 3, 4, -1].map((week) => <option key={week} value={week}>{week === -1 ? t('tasks.repeatLastWeek') : week}</option>)}</Select>
            <Select label={t('tasks.repeatWeekday')} value={options.weekday} onChange={(event) => onChange({ ...v, options: { ...options, weekday: Number(event.target.value) } })}>{days.map(({ day, label }) => <option key={day} value={day}>{label}</option>)}</Select>
        </>}
    </div>;
}
