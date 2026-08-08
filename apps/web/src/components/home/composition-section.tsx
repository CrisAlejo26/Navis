import type { DashboardSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { BucketBars } from '@/components/ui/bucket-bars';

/**
 * Cómo está repartida la iglesia entre sedes, labores y dones (RFC 0001).
 *
 * La misma `BucketBars` de las estadísticas de una lista (Regla 1): el reparto
 * de gente es el mismo dato mirado desde dos sitios distintos, así que se pinta
 * igual en los dos.
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
    <div className="gap-4 lg:grid-cols-3 grid">
      <BucketBars title={t('calendar.congregations')} buckets={composition.byCongregation} />
      <BucketBars title={t('believers.ministries')} buckets={composition.byMinistry} />
      <BucketBars title={t('believers.gifts')} buckets={composition.byGift} />
    </div>
  );
}
