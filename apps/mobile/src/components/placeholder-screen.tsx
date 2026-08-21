import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';

export type NavKey =
  | 'nav.calendar'
  | 'nav.believers'
  | 'nav.prophecies'
  | 'nav.dreams'
  | 'nav.teachings'
  | 'nav.communications';

/**
 * Pantalla puente para las secciones que todavía son solo una RFC.
 * Cada una se sustituirá al implementar su documento de docs/rfcs.
 */
export function PlaceholderScreen({ titleKey, rfc }: { titleKey: NavKey; rfc: string }) {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <Text className="text-2xl font-semibold text-foreground">{t(titleKey)}</Text>
      <Card title={t('common.comingSoon')}>
        <View className="gap-1 flex-row flex-wrap items-baseline">
          <Text className="text-sm text-muted-foreground">Especificación:</Text>
          <Text className="font-mono text-sm text-foreground">docs/rfcs/{rfc}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
