import type { DashboardAttentionPerson } from '@navis/shared';
import { TriangleAlert, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { MetricCard } from '@/components/home/metric-card';
import { Card } from '@/components/ui/card';
import { formatAgo } from '@/lib/format';

/**
 * El estado de la iglesia, en un solo instrumento (RFC 0001, D-panel).
 *
 * Creyentes y «piden atención» son las dos preguntas que se hacen juntas al
 * abrir el panel —cuántos somos, a quién se le está yendo el tiempo—, así que
 * comparten un cuadro con una sola línea partiéndolo, en vez de ser dos fichas
 * idénticas sueltas en una rejilla (Regla 9 §2: nada de plantilla de SaaS).
 */
export function StatusCard({
  believers,
  attention,
}: {
  believers: { total: number; newThisMonth: number };
  attention: { count: number; people: readonly DashboardAttentionPerson[] };
}) {
  const { t } = useTranslation();

  return (
    <Card className="p-0 gap-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 grid grid-cols-1 divide-y overflow-hidden">
      <MetricCard
        icon={Users}
        label={t('home.believers')}
        value={believers.total}
        sub={t('home.newThisMonth', { count: believers.newThisMonth })}
        to="/believers"
        linkLabel={t('home.believersLink')}
      />

      <MetricCard
        icon={TriangleAlert}
        label={t('home.attention')}
        value={attention.count}
        to="/believers?attention=true"
        linkLabel={t('home.attentionLink')}
      >
        {attention.people.length > 0 && (
          <ul className="gap-2 flex flex-col">
            {attention.people.map((person) => (
              <li key={person.id} className="gap-2 flex items-center">
                <BelieverPhoto believer={{ id: person.id, hasPhoto: person.hasPhoto }} size="sm" />
                <p className="text-sm min-w-0 flex-1 truncate">{person.name}</p>
                <p className="text-xs shrink-0 text-muted-foreground">
                  {formatAgo(person.daysWithoutNote)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </MetricCard>
    </Card>
  );
}
