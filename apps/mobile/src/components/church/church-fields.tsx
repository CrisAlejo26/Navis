import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/ui/text-field';
import { CountryField } from './country-field';

export interface ChurchFieldsProps {
    name: string;
    city: string;
    country: string;
    setName: (value: string) => void;
    setCity: (value: string) => void;
    setCountry: (value: string) => void;
    disabled?: boolean;
}
export function ChurchFields({
    name,
    city,
    country,
    setName,
    setCity,
    setCountry,
    disabled,
}: ChurchFieldsProps) {
    const { t } = useTranslation();
    return (
        <>
            <TextField
                label={t('church.name')}
                value={name}
                onChangeText={setName}
                editable={!disabled}
                autoCapitalize="words"
                maxLength={120}
            />
            <TextField
                label={t('church.city')}
                value={city}
                onChangeText={setCity}
                editable={!disabled}
                autoCapitalize="words"
                maxLength={120}
            />
            <CountryField value={country} onChange={setCountry} disabled={disabled} />
        </>
    );
}
