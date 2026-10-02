import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import type { LocalUser } from '@/data/repos/account-repo';
import { useUpdateProfile } from '@/hooks/use-settings';
import { useTimezoneOptions } from '@/lib/geo/timezones';

/**
 * El formulario nace con los datos ya cargados (por eso se monta con `key`):
 * así ningún `refetch` pisa lo que se está escribiendo.
 */
export function ProfileForm({ user }: { user: LocalUser }) {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const update = useUpdateProfile();
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone ?? '');
    const [city, setCity] = useState(user.city ?? '');
    const [bio, setBio] = useState(user.bio ?? '');
    const [timezone, setTimezone] = useState(user.timezone);
    const [failed, setFailed] = useState(false);
    const zones = useTimezoneOptions(user.timezone);

    async function save(): Promise<void> {
        setFailed(false);
        try {
            await update.mutateAsync({ name, phone, city, bio, timezone });
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
                contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: bottomPadding }}
            >
                <Text className="text-sm text-muted-foreground">{t('profile.description')}</Text>
                <TextField label={t('auth.name')} value={name} onChangeText={setName} />
                <TextField
                    label={t('profile.phone')}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <TextField label={t('profile.city')} value={city} onChangeText={setCity} />
                <Select
                    label={t('profile.timezone')}
                    value={timezone}
                    options={zones}
                    placeholder={t('settings.choose')}
                    onChange={setTimezone}
                />
                <TextField
                    label={t('profile.bio')}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={500}
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
