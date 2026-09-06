import { loginSchema } from '@navis/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BrandHeader } from '@/components/auth/brand-header';
import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { signIn } from '@/lib/auth-client';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(): Promise<void> {
    setError(null);

    // El mismo esquema zod que usa la web y que valida la API.
    const parsed = loginSchema.safeParse({ email, password, rememberMe: true });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setLoading(true);
    const { error: authError } = await signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (authError) {
      setError(t('auth.invalidCredentials'));
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
        <BrandHeader />

        <Animated.View
          entering={FadeInUp.delay(80).duration(420).springify().damping(18)}
          className="gap-6 rounded-t-3xl p-6 pt-8 grow justify-between bg-background"
          style={{ marginTop: -20 }}
        >
          <View className="gap-6">
            <View className="gap-1">
              <Text className="text-xl font-semibold text-foreground">{t('auth.signInTitle')}</Text>
              <Text className="text-sm text-muted-foreground">{t('auth.signInSubtitle')}</Text>
            </View>

            <View className="gap-4">
              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <TextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
              />

              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

              <Button
                title={loading ? t('auth.signingIn') : t('auth.signIn')}
                loading={loading}
                size="lg"
                onPress={() => {
                  void onSubmit();
                }}
              />
            </View>

            <View className="gap-1 flex-row items-center justify-center">
              <Text className="text-sm text-muted-foreground">{t('auth.noAccount')}</Text>
              <Link href="/(auth)/register" className="text-sm font-medium text-primary">
                {t('auth.signUp')}
              </Link>
            </View>
          </View>

          <View className="gap-4 pt-4 flex-row items-center justify-center">
            <ThemeToggle />
            <LanguageSelect />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
