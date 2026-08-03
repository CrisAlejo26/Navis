import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOut, useSession } from '@/lib/auth-client';
import { env } from '@/lib/env';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  async function onSignOut(): Promise<void> {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pt-16">
      <Text className="text-2xl font-semibold text-foreground">{t('settings.title')}</Text>

      <Card title={t('settings.appearance')}>
        <View className="gap-4 pt-2">
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground">{t('theme.label')}</Text>
            <ThemeToggle />
          </View>
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground">{t('language.label')}</Text>
            <LanguageSelect />
          </View>
        </View>
      </Card>

      <Card title={t('settings.profile')} description={session?.user.email}>
        <Button
          title={t('auth.signOut')}
          variant="secondary"
          className="mt-2"
          onPress={() => {
            void onSignOut();
          }}
        />
      </Card>

      {/* La conexión se configura por variables de entorno (EXPO_PUBLIC_*),
          no desde la app: ver docs/rfcs/0007-modo-local-y-servidor.md */}
      <Card title={t('settings.connection')} description={env.EXPO_PUBLIC_API_URL} />
    </ScrollView>
  );
}
