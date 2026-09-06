import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { MoreMenuContent } from '@/components/navigation/more-menu-content';

/** Pantalla de respaldo del menú «Más»: el mismo listado que el bottom sheet. */
export default function MoreScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pt-16">
      <View className="gap-0.5">
        <Text className="text-2xl font-semibold text-foreground">{t('nav.more')}</Text>
        <Text className="text-muted-foreground">{t('nav.allSections')}</Text>
      </View>
      <MoreMenuContent />
    </ScrollView>
  );
}
