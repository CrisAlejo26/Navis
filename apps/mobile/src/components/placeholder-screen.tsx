import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { TopBar } from '@/components/ui/top-bar';

export type NavKey =
  | 'nav.dashboard'
  | 'nav.calendar'
  | 'nav.believers'
  | 'nav.prophecies'
  | 'nav.dreams'
  | 'nav.teachings'
  | 'nav.communications'
  | 'nav.lists'
  | 'nav.tables'
  | 'nav.journal'
  | 'nav.tasks'
  | 'nav.users'
  | 'nav.settings'
  | 'nav.more';

/**
 * Pantalla puente para las secciones que todavía son solo una RFC.
 * Cada una se sustituirá al implementar su documento de docs/rfcs.
 */
export function PlaceholderScreen({ titleKey, rfc }: { titleKey: NavKey; rfc: string }) {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <TopBar title={t(titleKey)} />
      <Card title={t('common.comingSoon')}>
        <View className="gap-1 flex-row flex-wrap items-baseline">
          <Text className="text-sm text-muted-foreground">Especificación:</Text>
          <Text className="font-mono text-sm text-foreground">docs/rfcs/{rfc}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
