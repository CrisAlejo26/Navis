import { MAX_SELECT_OPTIONS, type ColumnOption } from '@navis/shared';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { newId } from '@/data/db';
import { TextField } from '@/components/ui/text-field';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';

export function ColumnOptions({
    options,
    onChange,
}: {
    options: ColumnOption[];
    onChange: (value: ColumnOption[]) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-3">
            {options.map((option, index) => (
                <View key={option.value} className="gap-2 p-3 rounded-lg border border-border">
                    <TextField
                        label={t('tables.optionLabel')}
                        value={option.label}
                        onChangeText={(label) =>
                            onChange(
                                options.map((one, i) => (i === index ? { ...one, label } : one)),
                            )
                        }
                    />
                    <ColorPicker
                        label={t('tables.color')}
                        value={option.color ?? 'primary'}
                        onChange={(color) =>
                            onChange(
                                options.map((one, i) => (i === index ? { ...one, color } : one)),
                            )
                        }
                    />
                    <Button
                        variant="link"
                        title={t('tables.removeOption')}
                        onPress={() => onChange(options.filter((_, i) => i !== index))}
                    />
                </View>
            ))}
            <Button
                variant="secondary"
                disabled={options.length >= MAX_SELECT_OPTIONS}
                title={t('tables.addOption')}
                onPress={() => onChange([...options, { value: newId(), label: '' }])}
            />
        </View>
    );
}
