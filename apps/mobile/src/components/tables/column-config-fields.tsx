import { TABLE_BELIEVER_FIELDS, believerFieldMatchesType } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import type { useColumnForm } from '@/hooks/use-column-form';
import { TextField } from '@/components/ui/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { boundLabels } from './column-labels';

export function ColumnConfigFields({
    form,
    linked,
}: {
    form: ReturnType<typeof useColumnForm>;
    linked: boolean;
}) {
    const { t } = useTranslation();
    return (
        <>
            {form.type === 'currency' ? (
                <TextField
                    label={t('tables.columnType.currency')}
                    value={form.currency}
                    onChangeText={form.setCurrency}
                    autoCapitalize="characters"
                    maxLength={3}
                />
            ) : null}
            {form.type === 'number' || form.type === 'currency' ? (
                <TextField
                    label={t('tables.mobile.decimals')}
                    value={form.decimals}
                    onChangeText={form.setDecimals}
                    keyboardType="number-pad"
                />
            ) : null}
            {form.type === 'date' ? (
                <Checkbox
                    label={t('tables.mobile.includeTime')}
                    checked={form.includeTime}
                    onChange={form.setIncludeTime}
                />
            ) : null}
            {linked ? (
                <Select
                    label={t('tables.boundTo')}
                    value={form.bound}
                    placeholder={t('tables.boundManual')}
                    options={[
                        { value: 'manual', label: t('tables.boundManual') },
                        ...TABLE_BELIEVER_FIELDS.filter((field) =>
                            believerFieldMatchesType(field, form.type),
                        ).map((value) => ({ value, label: t(boundLabels[value]) })),
                    ]}
                    onChange={form.setBound}
                />
            ) : null}
            {linked ? (
                <Text className="font-sans text-sm text-muted-foreground">
                    {t(
                        form.bound === 'manual'
                            ? 'tables.boundManualHint'
                            : 'tables.bindOverwriteHint',
                    )}
                </Text>
            ) : null}
        </>
    );
}
