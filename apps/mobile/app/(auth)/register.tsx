import { registerSchema } from '@navis/shared';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BrandHeader } from '@/components/auth/brand-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { signUp } from '@/lib/auth-client';

export default function RegisterScreen() {
  const { t } = useTranslation();
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
    const { error: authError } = await signUp.email(parsed.data);
    setLoading(false);

    if (authError) {
      setError(authError.message ?? t('errors.generic'));
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
