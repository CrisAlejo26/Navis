import { createChurchSchema } from '@navis/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BrandHeader } from '@/components/auth/brand-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { createChurch } from '@/data/repos/church-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Crear la iglesia **local** (RFC 0024, Fase 3): el mismo formulario que
 * `ChurchForm` en la web —nombre y ciudad, y ya—, escrito en la base del
 * teléfono. Es un paso bloqueante a propósito: sin iglesia no hay dónde
 * guardar un creyente ni una nota, igual que `welcome.tsx` en web.
 */
export default function ChurchSetupScreen() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const setChurch = useLocalSession((state) => state.setChurch);
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(): Promise<void> {
        setError(null);
        if (!session) {
            router.replace('/(auth)/welcome');
            return;
        }

        const parsed = createChurchSchema.safeParse({ name, city });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
            return;
        }

        setLoading(true);
        try {
            const church = await createChurch({
                name: parsed.data.name,
                city: parsed.data.city,
                ownerId: session.userId,
            });
            setChurch(church.id);
            router.replace('/(tabs)');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
                <BrandHeader tagline={false} />

                <Animated.View
                    entering={FadeInUp.delay(80).duration(420).springify().damping(18)}
                    className="gap-6 rounded-t-3xl p-6 pt-8 grow bg-background"
                    style={{ marginTop: -20 }}
                >
                    <View className="gap-1">
                        <Text className="text-xl font-semibold text-foreground">
                            {t('church.welcomeTitle')}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            {t('church.welcomeSubtitle')}
                        </Text>
                    </View>

                    <View className="gap-4">
                        <TextField
                            label={t('church.name')}
                            value={name}
                            onChangeText={setName}
                            autoComplete="organization"
                        />
                        <TextField label={t('church.city')} value={city} onChangeText={setCity} />

                        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

                        <Button
                            title={t('church.create')}
                            loading={loading}
                            size="lg"
                            onPress={() => {
                                void onSubmit();
                            }}
                        />
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
