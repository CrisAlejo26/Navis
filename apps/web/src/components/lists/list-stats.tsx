import { useListStats } from '@navis/api-client';
import type { List } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AccessLogRows } from '@/components/lists/access-log-rows';
import { BucketBars } from '@/components/lists/bucket-bars';
import { OverlapRows } from '@/components/lists/overlap-rows';
import { ViewerRowsStats } from '@/components/lists/viewer-rows-stats';
import { Wake } from '@/components/lists/wake';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';

/**
 * La pestaña **Estadísticas** (RFC 0010 §8.3).
 *
 * El orden no es casual: en una restringida lo primero es **quién ha entrado**
 * (D35), porque es la pregunta que se hace quien abre esta pestaña. Después la
 * estela, que es el elemento firma; después la composición; y el solapamiento al
 * final, que es lo que se mira con calma.
 */
export function ListStats({ list }: { list: List }) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useListStats(api, list.id);

  if (isLoading || !stats) return <Skeleton className="h-64 w-full" />;

  const restringida = list.visibility === 'restricted';

  return (
    <div className="gap-4 flex flex-col">
      {restringida && <ViewerRowsStats viewers={stats.audience.byViewer} />}

      {list.visibility !== 'private' && (
        <>
          <Wake days={stats.audience.days} accent={list.accent} />
          <p className="text-sm text-muted-foreground">
            {t('lists.audienceSummary', {
              views: formatNumber(stats.audience.views),
              visitors: formatNumber(stats.audience.visitors),
            })}
          </p>
        </>
      )}

      <div className="gap-4 lg:grid-cols-2 grid">
        <BucketBars title={t('calendar.congregations')} buckets={stats.members.byCongregation} />
        <BucketBars title={t('believers.ministries')} buckets={stats.members.byMinistry} />
        <BucketBars title={t('believers.gifts')} buckets={stats.members.byGift} />
        <BucketBars title={t('lists.byReferrer')} buckets={stats.audience.byReferrer} />
      </div>

      <OverlapRows overlap={stats.overlap} />

      {restringida && (
        <>
          <p className="text-sm text-muted-foreground">
            {t('lists.neverEntered', {
              count: stats.access.neverEntered,
              granted: stats.access.granted,
            })}
          </p>
          <AccessLogRows entries={stats.access.recent} />
        </>
      )}
    </div>
  );
}
