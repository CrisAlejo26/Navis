import type { DashboardSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { BucketBars } from '@/components/home/bucket-bars';

/**
 * Cómo está repartida la iglesia entre sedes, labores y dones (RFC 0001).
 * Apiladas y no en columnas: la web las pone en `lg:grid-cols-3`, un ancho que
 * un teléfono no tiene.
 */
export function CompositionSection({
  composition,
}: {
  composition: DashboardSummary['composition'];
}) {
  const { t } = useTranslation();

  if (
    composition.byCongregation.length === 0 &&
    composition.byMinistry.length === 0 &&
    composition.byGift.length === 0
  ) {
    return null;
  }

  return (
    <View className="gap-3">
      <Text className="text-sm font-semibold text-muted-foreground">{t('home.composition')}</Text>
      <BucketBars title={t('calendar.congregations')} buckets={composition.byCongregation} />
      <BucketBars title={t('believers.ministries')} buckets={composition.byMinistry} />
      <BucketBars title={t('believers.gifts')} buckets={composition.byGift} />
    </View>
  );
}
