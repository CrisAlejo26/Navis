import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    toIsoDate,
    type CustomTableColumn,
    type RowFilter,
} from '@navis/shared';
import { TextField } from '@/components/ui/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { SelectField } from './fields/select-field';

export function FilterField({
    column,
    onAdd,
}: {
    column: CustomTableColumn;
    onAdd: (filter: RowFilter) => void;
}) {
    const { t } = useTranslation(),
        [text, setText] = useState(''),
        [max, setMax] = useState(''),
        [checked, setChecked] = useState(false),
        [values, setValues] = useState<string[]>([]);
    const range = ['number', 'currency', 'date'].includes(column.type),
        select = ['single_select', 'multi_select'].includes(column.type);
    function add() {
        const value = range
            ? column.type === 'date'
                ? { from: text || undefined, to: max || undefined }
                : {
                      min: text ? Number(text.replace(',', '.')) : undefined,
                      max: max ? Number(max.replace(',', '.')) : undefined,
                  }
            : select
              ? values
              : column.type === 'checkbox'
                ? checked
                : text;
        onAdd({
            columnKey: column.key,
            operator: range
                ? 'between'
                : select
                  ? 'in'
                  : column.type === 'checkbox'
                    ? 'equals'
                    : 'contains',
            value,
        });
    }
    return (
        <View className="gap-3">
            {select ? (
                <SelectField
                    column={{ ...column, type: 'multi_select' }}
                    value={values}
                    onChange={(value) =>
                        setValues(
                            Array.isArray(value)
                                ? value.filter((item): item is string => typeof item === 'string')
                                : [],
                        )
                    }
                />
            ) : column.type === 'checkbox' ? (
                <Checkbox label={column.label} checked={checked} onChange={setChecked} />
            ) : column.type === 'date' ? (
                <>
                    <View className="gap-2 flex-row flex-wrap">
                        {(['today', 'thisWeek', 'thisMonth'] as const).map((shortcut) => (
                            <Button
                                key={shortcut}
                                variant="secondary"
                                title={t(`tables.filters.${shortcut}`)}
                                onPress={() => {
                                    const today = toIsoDate(new Date());
                                    setText(
                                        shortcut === 'today'
                                            ? today
                                            : shortcut === 'thisWeek'
                                              ? startOfWeek(today)
                                              : startOfMonth(today),
                                    );
                                    setMax(
                                        shortcut === 'today'
                                            ? today
                                            : shortcut === 'thisWeek'
                                              ? endOfWeek(today)
                                              : endOfMonth(today),
                                    );
                                }}
                            />
                        ))}
                    </View>
                    <DatePicker
                        label={t('tables.filters.opFrom')}
                        value={text || null}
                        placeholder={t('tables.filters.opFrom')}
                        onChange={setText}
                        timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    />
                    <DatePicker
                        label={t('tables.filters.to')}
                        value={max || null}
                        placeholder={t('tables.filters.to')}
                        onChange={setMax}
                        timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    />
                </>
            ) : (
                <>
                    <TextField
                        label={range ? t('tables.filters.min') : t('tables.filters.contains')}
                        value={text}
                        keyboardType={range ? 'decimal-pad' : 'default'}
                        onChangeText={setText}
                    />
                    {range ? (
                        <TextField
                            label={t('tables.filters.max')}
                            value={max}
                            keyboardType="decimal-pad"
                            onChangeText={setMax}
                        />
                    ) : null}
                </>
            )}
            <Button
                title={t('tables.filters.add')}
                onPress={add}
                disabled={
                    range &&
                    column.type !== 'date' &&
                    [text, max].some(
                        (value) =>
                            value !== '' && !Number.isFinite(Number(value.replace(',', '.'))),
                    )
                }
            />
        </View>
    );
}
