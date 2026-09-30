import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import type { LocalChurch } from '@/data/repos/church-repo';
import { useUpdateChurch } from '@/hooks/use-settings';
import { useCountryOptions } from '@/lib/geo/countries';
import { useTimezoneOptions } from '@/lib/geo/timezones';

/** La ficha de la iglesia: como el de perfil, nace con los datos cargados (`key`). */
export function ChurchForm({ church }: { church: LocalChurch }) {
    const { t } = useTranslation();
    const update = useUpdateChurch();
    const [name, setName] = useState(church.name);
    const [city, setCity] = useState(church.city ?? '');
    const [country, setCountry] = useState(church.country);
    const [timezone, setTimezone] = useState(church.timezone);
    const [failed, setFailed] = useState(false);
    const countries = useCountryOptions();
    const zones = useTimezoneOptions(church.timezone);

    async function save(): Promise<void> {
        setFailed(false);
        try {
            await update.mutateAsync({ name, city, country, timezone });
            router.back();
        } catch {
            setFailed(true);
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-4 p-4 pb-8"
            >
                <Text className="text-sm text-muted-foreground">{t('settings.churchHint')}</Text>
                <TextField label={t('church.name')} value={name} onChangeText={setName} />
                <TextField label={t('church.city')} value={city} onChangeText={setCity} />
                <Select
                    label={t('church.country')}
                    value={country}
                    options={countries}
                    placeholder={t('settings.choose')}
                    onChange={setCountry}
                />
                <Text className="-mt-2 text-xs text-muted-foreground">
                    {t('church.countryHint')}
                </Text>
                <Select
                    label={t('profile.timezone')}
                    value={timezone}
                    options={zones}
                    placeholder={t('settings.choose')}
                    onChange={setTimezone}
                />
                {failed ? (
                    <View accessibilityLiveRegion="polite">
                        <Text className="text-sm text-destructive">{t('errors.validation')}</Text>
                    </View>
                ) : null}
                <Button
                    title={t('common.save')}
                    size="lg"
                    loading={update.isPending}
                    onPress={() => void save()}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
