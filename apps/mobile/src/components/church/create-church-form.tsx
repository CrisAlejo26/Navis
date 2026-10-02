import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useCreateChurch } from '@/hooks/use-create-church';
import { deviceCountry } from '@/lib/geo/device-country';
import { ChurchFields } from './church-fields';

export function CreateChurchForm() {
    const bottomPadding = usePageBottomPadding();
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
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 24,
                    paddingBottom: bottomPadding,
                    gap: 24,
                }}
            >
                <View className="gap-3">
                    <Icon
                        name="home-outline"
                        size="lg"
                        tone="primary"
                        background="soft"
                        containerSize={52}
                    />
                    <Text className="text-2xl font-sans-semibold text-foreground">
                        {t('church.create')}
                    </Text>
                    <Text className="text-base leading-6 text-muted-foreground">
                        {t('church.addHint')}
                    </Text>
                </View>
                <View className="gap-5 rounded-3xl p-5 border border-border bg-card">
                    <ChurchFields
                        name={name}
                        city={city}
                        country={country}
                        setName={setName}
                        setCity={setCity}
                        setCountry={setCountry}
                        disabled={create.isPending}
                    />
                </View>
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
