import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { MoreMenuContent } from '@/components/navigation/more-menu-content';
import { TopBar } from '@/components/ui/top-bar';

/** Pantalla de respaldo del menú «Más»: el mismo listado que el bottom sheet. */
export default function MoreScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pt-16">
      <TopBar title={t('nav.more')} subtitle={t('nav.allSections')} />
      <MoreMenuContent />
    </ScrollView>
  );
}
