import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { toSearchName } from '@navis/shared';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldButton } from '@/components/ui/field-button';
import { SearchField } from '@/components/ui/search-field';
import { Icon } from '@/components/ui/icon';
import { useCountryOptions } from '@/lib/geo/countries';

export function CountryField({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    const countries = useCountryOptions();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const term = toSearchName(search);
    const options = countries.filter((country) =>
        toSearchName(`${country.label} ${country.value}`).includes(term),
    );
    return (
        <>
            <FieldButton
                label={t('church.country')}
                value={countries.find((c) => c.value === value)?.label}
                placeholder={t('settings.choose')}
                icon="chevron-down"
                disabled={disabled}
                onPress={() => {
                    setSearch('');
                    setOpen(true);
                }}
            />
            <Text className="-mt-2 text-xs text-muted-foreground">{t('church.countryHint')}</Text>
            <BottomSheet visible={open} onClose={() => setOpen(false)} title={t('church.country')}>
                <SearchField
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('church.searchPlaceholder')}
                    accessibilityLabel={t('church.searchPlaceholder')}
                />
                <View className="pb-2">
                    {options.map((country) => (
                        <Pressable
                            key={country.value}
                            accessibilityRole="button"
                            accessibilityLabel={country.label}
                            accessibilityState={{ selected: value === country.value }}
                            onPress={() => {
                                onChange(country.value);
                                setOpen(false);
                            }}
                            className="min-h-11 gap-2 px-3 py-2 flex-row items-center"
                        >
                            <Text className="text-base flex-1 text-foreground">
                                {country.label}
                            </Text>
                            {value === country.value ? (
                                <Icon name="checkmark" tone="primary" />
                            ) : null}
                        </Pressable>
                    ))}
                    {!options.length ? (
                        <Text className="py-4 text-muted-foreground">
                            {t('church.countryNoResults')}
                        </Text>
                    ) : null}
                </View>
            </BottomSheet>
        </>
    );
}
