import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableWithColumns, RowFilter } from '@navis/shared';
import type { TableQuery } from '@/data/repos/table-query';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterField } from './filter-field';

export function QuerySheet({
    table,
    query,
    onChange,
    onClose,
}: {
    table: CustomTableWithColumns;
    query: TableQuery;
    onChange: (query: TableQuery) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [key, setKey] = useState('');
    const columns = table.columns.filter((column) => column.type !== 'password'),
        column = columns.find((one) => one.key === key);
    function add(filter: RowFilter) {
        onChange({
            ...query,
            filters: [
                ...(query.filters ?? []).filter((one) => one.columnKey !== filter.columnKey),
                filter,
            ],
        });
        setKey('');
    }
    return (
        <BottomSheet visible onClose={onClose} title={t('tables.filters.panelTitle')}>
            <View className="gap-4">
                <Select
                    label={t('tables.sortBy')}
                    value={query.sort ?? ''}
                    placeholder={t('dataTable.sortDefault')}
                    options={[
                        { value: '', label: t('dataTable.sortDefault') },
                        ...columns.map((one) => ({ value: one.key, label: one.label })),
                    ]}
                    onChange={(sort) => onChange({ ...query, sort: sort || undefined })}
                />
                <Select
                    label={t('dataTable.sortLabel')}
                    value={query.order ?? 'asc'}
                    placeholder={t('tables.sortAsc')}
                    options={[
                        { value: 'asc', label: t('tables.sortAsc') },
                        { value: 'desc', label: t('tables.sortDesc') },
                    ]}
                    onChange={(order) => onChange({ ...query, order })}
                />
                <Select
                    label={t('tables.filters.add')}
                    value={key}
                    placeholder={t('tables.columns')}
                    options={columns.map((one) => ({ value: one.key, label: one.label }))}
                    onChange={setKey}
                />
                {column ? <FilterField key={key} column={column} onAdd={add} /> : null}
                {(query.filters ?? []).map((filter) => (
                    <Button
                        key={filter.columnKey}
                        variant="secondary"
                        title={t('tables.filters.removeAria', {
                            label:
                                columns.find((one) => one.key === filter.columnKey)?.label ??
                                filter.columnKey,
                        })}
                        onPress={() =>
                            onChange({
                                ...query,
                                filters: query.filters?.filter((one) => one !== filter),
                            })
                        }
                    />
                ))}
            </View>
        </BottomSheet>
    );
}
