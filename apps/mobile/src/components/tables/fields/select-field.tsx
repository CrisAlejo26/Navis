import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomTableColumn } from '@navis/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup } from '@/components/ui/radio-group';
import { SearchField } from '@/components/ui/search-field';

export function SelectField({
    column,
    value,
    onChange,
}: {
    column: CustomTableColumn;
    value: unknown;
    onChange: (value: unknown) => void;
}) {
    const { t } = useTranslation(),
        [search, setSearch] = useState('');
    const options =
        column.options?.filter((option) =>
            option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        ) ?? [];
    const values: unknown[] = Array.isArray(value) ? value : [];
    return (
        <View className="gap-2">
            <Text className="font-sans-medium text-foreground">{column.label}</Text>
            {(column.options?.length ?? 0) > 6 ? (
                <SearchField
                    placeholder={t('tables.search')}
                    value={search}
                    onChangeText={setSearch}
                />
            ) : null}
            {column.type === 'single_select' ? (
                <RadioGroup
                    value={typeof value === 'string' ? value : ''}
                    options={options.map((option) => ({
                        value: option.value,
                        label: option.label,
                    }))}
                    onChange={onChange}
                />
            ) : (
                options.map((option) => (
                    <Checkbox
                        key={option.value}
                        label={column.label + ': ' + option.label}
                        checked={values.includes(option.value)}
                        onChange={(checked) =>
                            onChange(
                                checked
                                    ? [...values, option.value]
                                    : values.filter((one: unknown) => one !== option.value),
                            )
                        }
                    />
                ))
            )}
        </View>
    );
}
