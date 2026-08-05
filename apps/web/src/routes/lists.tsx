import { useListMemberships, useLists } from '@navis/api-client';
import { LIST_OVERLAP_THRESHOLD, SEEDED_LISTS } from '@navis/shared';
import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ListForm } from '@/components/lists/list-form';
import { ListPanel } from '@/components/lists/list-panel';
import { ListsHeader } from '@/components/lists/lists-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';

/** 40 ms entre paneles y nunca más de 400 ms en total (RFC 0010 §8.2). */
const CASCADA_MS = 40;
const CASCADA_MAX = 400;

/**
 * **El tablón** (RFC 0010 §8.2, D38).
 *
 * La pregunta que responde no es «cuántas listas hay», es «qué hay puesto en la
 * puerta ahora mismo»: por eso cada lista es un panel **relleno de su color** y
 * no una tarjeta blanca con un puntito. Doce listas son doce colores.
 */
export function ListsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data: lists, isLoading } = useLists(api);
  // Los puntos de creyentes y esta cuenta salen de la misma llamada cacheada
  // (§8.7): quien no puede ver creyentes tampoco ve la línea, que lleva allí.
  const { data: memberships } = useListMemberships(api, can('believers.view'));
  const [creando, setCreando] = useState(false);

  if (isLoading || !lists) return <PageSkeleton />;

  const activas = lists.filter((one) => one.isActive);
  const onAdd = can('lists.manage')
    ? () => {
        setCreando(true);
      }
    : undefined;

  const overloaded = memberships
    ? Object.values(memberships).filter((ids) => ids.length >= LIST_OVERLAP_THRESHOLD).length
    : null;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <ListsHeader lists={activas} overloaded={overloaded} onAdd={onAdd} />

      {activas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t('lists.emptyTitle')}
          action={
            onAdd && (
              <Button size="lg" onClick={onAdd}>
                {t('lists.add')}
              </Button>
            )
          }
        >
          {t('lists.emptyBody', { names: SEEDED_LISTS.map((one) => one.name).join(', ') })}
        </EmptyState>
      ) : (
        <div className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {activas.map((list, index) => (
            <ListPanel
              key={list.id}
              list={list}
              delay={Math.min(index * CASCADA_MS, CASCADA_MAX)}
            />
          ))}
        </div>
      )}

      <ListForm
        open={creando}
        onClose={() => {
          setCreando(false);
        }}
      />
    </section>
  );
}
