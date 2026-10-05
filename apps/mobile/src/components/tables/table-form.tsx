import {
    createCustomTableSchema,
    type CreateCustomTableInput,
    type CustomTable,
} from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Select } from '@/components/ui/select';
import { tableIconLabels } from '@/lib/tables/icons';

export function TableForm({
    table,
    onClose,
    onSave,
}: {
    table?: CustomTable;
    onClose: () => void;
    onSave: (value: CreateCustomTableInput) => Promise<unknown>;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState(table?.name ?? ''),
        [accent, setAccent] = useState(table?.accent ?? 'primary');
    const [icon, setIcon] = useState(table?.icon ?? 'clipboard'),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(false);
    async function save() {
        if (busy) return;
        const value = createCustomTableSchema.safeParse({ name, accent, icon });
        if (!value.success) return setError(true);
        setBusy(true);
        try {
            await onSave(value.data);
            onClose();
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    }
    return (
        <BottomSheet
            visible
            title={t(table ? 'tables.edit' : 'tables.newTable')}
            onClose={() => {
                if (!busy) onClose();
            }}
        >
            <View className="gap-4 pb-4">
                <TextField
                    label={t('tables.name')}
                    value={name}
                    onChangeText={setName}
                    maxLength={60}
                />
                <Select
                    label={t('tables.mobile.icon')}
                    value={icon}
                    placeholder={t('tables.mobile.icon')}
                    options={Object.entries(tableIconLabels).map(([value, label]) => ({
                        value,
                        label: t(label),
                    }))}
                    onChange={setIcon}
                />
                <ColorPicker label={t('tables.color')} value={accent} onChange={setAccent} />
                {error ? <FieldError message={t('tables.saveFailed')} /> : null}
                <Button
                    size="lg"
                    title={t('common.save')}
                    loading={busy}
                    onPress={() => void save()}
                />
            </View>
        </BottomSheet>
    );
}
