import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useCreateChurch } from '@/hooks/use-create-church';
import { deviceCountry } from '@/lib/geo/device-country';
import { ChurchFields } from './church-fields';

export function CreateChurchForm() {
    const { t } = useTranslation();
    const create = useCreateChurch();
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState(deviceCountry);
    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-4 p-5 pb-12"
            >
                <Text className="text-sm text-muted-foreground">{t('church.addHint')}</Text>
                <ChurchFields
                    name={name}
                    city={city}
                    country={country}
                    setName={setName}
                    setCity={setCity}
                    setCountry={setCountry}
                    disabled={create.isPending}
                />
                {create.isError ? (
                    <View accessibilityLiveRegion="polite">
                        <Text className="text-sm text-destructive">
                            {t(
                                create.error?.message === 'invalid-input' ||
                                    create.error?.message === 'invalid-country'
                                    ? 'errors.validation'
                                    : 'errors.generic',
                            )}
                        </Text>
                    </View>
                ) : null}
                <Button
                    title={t('church.create')}
                    size="lg"
                    loading={create.isPending}
                    disabled={name.trim().length < 2 || city.trim().length < 2}
                    onPress={() => {
                        create.mutate({ name, city, country });
                    }}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
