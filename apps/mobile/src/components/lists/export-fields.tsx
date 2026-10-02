import type { ListPublicFields } from '@navis/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Switch } from '@/components/ui/switch';
import { SegmentedControl } from '@/components/ui/segmented-control';

export function ExportFields({
    fields,
    onChange,
    disabled,
    preview,
}: {
    fields: ListPublicFields;
    onChange: (fields: ListPublicFields) => void;
    disabled: boolean;
    preview?: ReactNode;
}) {
    const { t } = useTranslation();
    const options = [
        { key: 'congregation', label: t('calendar.congregation') },
        { key: 'ministry', label: t('believers.ministries') },
        { key: 'note', label: t('lists.note') },
        { key: 'photo', label: t('lists.photos') },
        { key: 'arrival', label: t('lists.arrival') },
        { key: 'bibleReadings', label: t('lists.bibleReadings') },
        { key: 'vivenciasReadings', label: t('lists.vivenciasReadings') },
        { key: 'bibleInstituteTimes', label: t('lists.bibleInstituteTimes') },
    ] as const;
    return (
        <View className="gap-2">
            <Text className="text-sm font-sans-medium text-foreground">{t('lists.nameStyle')}</Text>
            <SegmentedControl
                value={fields.nameStyle}
                onChange={(nameStyle) => {
                    if (!disabled) onChange({ ...fields, nameStyle });
                }}
                options={[
                    { value: 'full', label: t('lists.nameFull') },
                    { value: 'initial', label: t('lists.nameInitial') },
                ]}
            />
            <Text className="text-sm text-muted-foreground">{t('lists.exportNameHint')}</Text>
            {preview}
            {options.map((one) => (
                <Switch
                    key={one.key}
                    label={one.label}
                    checked={fields[one.key]}
                    disabled={disabled}
                    onChange={(value) => onChange({ ...fields, [one.key]: value })}
                />
            ))}
        </View>
    );
}
