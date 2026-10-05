import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Select } from './select';
const options = (length: number) =>
    Array.from({ length }, (_, i) => {
        const value = String(i).padStart(2, '0');
        return { value, label: value };
    });
const hours = options(24),
    minutes = options(60);
export function TimePicker({
    value,
    onChange,
    label,
    disabled = false,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
}) {
    const { t } = useTranslation(),
        [hour = '09', minute = '00'] = value.split(':');
    return (
        <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
                <Select
                    label={label}
                    value={hour}
                    options={hours}
                    placeholder="09"
                    disabled={disabled}
                    onChange={(next) => onChange(`${next}:${minute}`)}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Select
                    label={t('journal.mobile.minutes')}
                    value={minute}
                    options={minutes}
                    placeholder="00"
                    disabled={disabled}
                    onChange={(next) => onChange(`${hour}:${next}`)}
                />
            </View>
        </View>
    );
}
