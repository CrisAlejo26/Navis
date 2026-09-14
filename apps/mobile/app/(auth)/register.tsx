import { registerSchema } from '@navis/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BrandHeader } from '@/components/auth/brand-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { createAccount } from '@/data/repos/account-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * El alta de la cuenta **local** (RFC 0024, Fase 1): el mismo esquema zod que
 * usaba el registro contra Better Auth (`registerSchema`, contraseña de 10+),
 * pero la cuenta nace en la base del teléfono. Después de aquí toca crear la
 * iglesia (`church-setup`) — sin ella no hay dónde guardar nada.
 */
export default function RegisterScreen() {
  const { t } = useTranslation();
  const setSession = useLocalSession((state) => state.setSession);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(): Promise<void> {
    setError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setLoading(true);
    const result = await createAccount({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if ('error' in result) {
      setError(t('auth.emailTaken'));
      return;
    }

    // Sin iglesia todavía: el guard de `(auth)` deja pasar y `index.tsx`
    // del grupo lleva a `church-setup`, que es el paso que falta.
    setSession({ userId: result.user.id, churchId: null });
    router.replace('/(auth)/church-setup');
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
            <Text className="text-xl font-semibold text-foreground">{t('auth.signUpTitle')}</Text>
            <Text className="text-sm text-muted-foreground">{t('auth.signUpSubtitle')}</Text>
          </View>

          <View className="gap-4">
            <TextField label={t('auth.name')} value={name} onChangeText={setName} />
            <TextField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            <TextField
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

            <Button
              title={t('auth.signUp')}
              loading={loading}
              size="lg"
              onPress={() => {
                void onSubmit();
              }}
            />
          </View>

          <View className="gap-1 flex-row items-center justify-center">
            <Text className="text-sm text-muted-foreground">{t('auth.haveAccount')}</Text>
            <Link href="/(auth)/login" className="text-sm font-medium text-primary">
              {t('auth.signIn')}
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
