import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ChurchFields } from '@/components/church/church-fields';
import type { LocalChurch } from '@/data/repos/church-repo';
import { useUpdateChurch } from '@/hooks/use-settings';
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
                <ChurchFields
                    name={name}
                    city={city}
                    country={country}
                    setName={setName}
                    setCity={setCity}
                    setCountry={setCountry}
                    disabled={update.isPending}
                />
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
