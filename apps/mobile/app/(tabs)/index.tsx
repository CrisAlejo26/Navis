import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pt-16">
      <View className="gap-1">
        <Text className="text-2xl font-semibold text-foreground">{t('home.title')}</Text>
        <Text className="text-muted-foreground">
          {session ? t('auth.welcome', { name: session.user.name }) : t('home.subtitle')}
        </Text>
      </View>

      <Card title={t('common.comingSoon')} description={t('home.subtitle')}>
        <Text className="text-sm text-muted-foreground">
          Especificación: docs/rfcs/0001-panel-de-metricas.md
        </Text>
      </Card>
    </ScrollView>
  );
}
