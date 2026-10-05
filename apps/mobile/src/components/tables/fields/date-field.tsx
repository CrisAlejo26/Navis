import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableColumn } from '@navis/shared';
import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';
import { combineLocalDate, localDateParts } from '@/lib/tables/date-value';

export function DateField({
    column,
    value,
    onChange,
}: {
    column: CustomTableColumn;
    value: string;
    onChange: (value: string) => void;
}) {
    const { t } = useTranslation(),
        parts = column.config?.includeTime ? localDateParts(value) : { day: value, time: '' };
    const [time, setTime] = useState(parts.time || '12:00');
    return (
        <View className="gap-2">
            <DatePicker
                label={column.label}
                value={parts.day || null}
                placeholder={column.label}
                timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={(day) =>
                    onChange(
                        column.config?.includeTime
                            ? combineLocalDate(
                                  day,
                                  /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '12:00',
                              )
                            : day,
                    )
                }
            />
            {column.config?.includeTime ? (
                <TextField
                    label={t('tables.mobile.time')}
                    value={time}
                    placeholder="HH:mm"
                    onChangeText={(next) => {
                        setTime(next);
                        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(next) && parts.day)
                            onChange(combineLocalDate(parts.day, next));
                    }}
                />
            ) : null}
        </View>
    );
}
