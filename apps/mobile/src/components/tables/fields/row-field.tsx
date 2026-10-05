import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomTableColumn } from '@navis/shared';
import { TextField } from '@/components/ui/text-field';
import { PasswordField } from '@/components/ui/password-field';
import { Checkbox } from '@/components/ui/checkbox';
import { DateField } from './date-field';
import { SelectField } from './select-field';

export function RowField({
    column,
    value,
    onChange,
}: {
    column: CustomTableColumn;
    value: unknown;
    onChange: (value: unknown) => void;
}) {
    const { t } = useTranslation();
    const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    const [numeric, setNumeric] = useState(text);
    const [previousValue, setPreviousValue] = useState(value);
    if (!Object.is(value, previousValue)) {
        setPreviousValue(value);
        if (value == null) setNumeric('');
    }
    if (column.type === 'checkbox')
        return <Checkbox label={column.label} checked={value === true} onChange={onChange} />;
    if (column.type === 'single_select' || column.type === 'multi_select')
        return <SelectField column={column} value={value} onChange={onChange} />;
    if (column.type === 'password')
        return (
            <PasswordField
                label={column.label}
                value={text}
                onChangeText={onChange}
                placeholder={t('tables.newPassword')}
            />
        );
    if (column.type === 'date')
        return <DateField column={column} value={text} onChange={onChange} />;
    if (column.type === 'number' || column.type === 'currency')
        return (
            <TextField
                label={column.label}
                value={numeric}
                keyboardType="numbers-and-punctuation"
                onChangeText={(raw) => {
                    setNumeric(raw);
                    onChange(raw.trim() === '' ? null : Number(raw.replace(',', '.')));
                }}
            />
        );
    return (
        <TextField
            label={column.label}
            value={text}
            onChangeText={onChange}
            multiline={column.type === 'long_text'}
            autoCapitalize={['email', 'url'].includes(column.type) ? 'none' : 'sentences'}
            autoCorrect={!['email', 'url'].includes(column.type)}
            keyboardType={
                column.type === 'email'
                    ? 'email-address'
                    : column.type === 'phone'
                      ? 'phone-pad'
                      : column.type === 'url'
                        ? 'url'
                        : 'default'
            }
        />
    );
}
