import type { DashboardAttentionPerson } from '@navis/shared';
import { TriangleAlert, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { MetricCard } from '@/components/home/metric-card';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { formatAgo } from '@/lib/format';

/**
 * El estado de la iglesia, en un solo instrumento (RFC 0001, D-panel).
 *
 * Creyentes y «piden atención» son las dos preguntas que se hacen juntas al
 * abrir el panel —cuántos somos, a quién se le está yendo el tiempo—, así que
 * comparten un cuadro con una sola línea partiéndolo, en vez de ser dos fichas
 * idénticas sueltas en una rejilla (Regla 9 §2: nada de plantilla de SaaS).
 *
 * Creyentes es el ancla de toda la primera fila del panel —cuántos somos— y
 * lleva el único tono `filled` de la fila; atención va en `warning`, que es
 * el mismo acento que ya usa `TriangleAlert` en el resto de la aplicación
 * para «esto pide que lo mires».
 *
 * `className` recibe el `col-span` de la rejilla del panel y se aplica **al
 * propio `Card`**, no a un `<div>` que lo envuelva: si el `Card` no es él
 * mismo el hijo directo de la rejilla, el estiramiento por defecto de CSS
 * Grid (`align-items: stretch`) se queda en el envoltorio y no llega a la
 * tarjeta, que se queda con su alto de contenido y dejaba un hueco en blanco
 * debajo mientras `EventsCard`/`NotesCard` sí llenaban la fila.
 */
export function StatusCard({
  believers,
  attention,
  className,
}: {
  believers: { total: number; newThisMonth: number };
  attention: { count: number; people: readonly DashboardAttentionPerson[] };
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'p-0 gap-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 grid grid-cols-1 divide-y overflow-hidden',
        className,
      )}
    >
      <MetricCard
        icon={Users}
        label={t('home.believers')}
        value={believers.total}
        sub={t('home.newThisMonth', { count: believers.newThisMonth })}
        to="/believers"
        linkLabel={t('home.believersLink')}
        tone="filled"
      />

      <MetricCard
        icon={TriangleAlert}
        label={t('home.attention')}
        value={attention.count}
        to="/believers?attention=true"
        linkLabel={t('home.attentionLink')}
        tone="warning"
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
