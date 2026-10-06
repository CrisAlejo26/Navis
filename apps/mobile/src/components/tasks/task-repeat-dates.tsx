import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/format';
export function TaskRepeatDates({ dates, onChange, timezone, anchor, busy }: { dates: string[]; onChange: (dates: string[]) => void; timezone: string; anchor: string; busy: boolean }) {
    const { t } = useTranslation(), [date, setDate] = useState(anchor);
    return <View className="gap-3">
        <Text className="font-sans text-sm text-muted-foreground">{t('tasks.repeatDatesHelp')}</Text>
        <DatePicker label={t('tasks.date')} placeholder={t('tasks.date')} value={date} timezone={timezone} disabled={busy} onChange={setDate} />
        <Button title={t('tasks.repeatDates')} variant="outline" disabled={busy || date < anchor || dates.includes(date) || dates.length >= 999} onPress={() => onChange([...dates, date].sort())} />
        <View className="gap-2 flex-row flex-wrap">{dates.map((day) => <Chip key={day} label={formatDay(day)} onRemove={() => onChange(dates.filter((v) => v !== day))} removeLabel={t('tasks.delete')} disabled={busy} />)}</View>
    </View>;
}
