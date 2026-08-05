import { useListViewers, useLists } from '@navis/api-client';
import type { ListViewer } from '@navis/shared';
import { KeyRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ViewerDetailDialog } from '@/components/lists/viewer-detail-dialog';
import { ViewerDirectoryRow } from '@/components/lists/viewer-directory-row';
import { ViewerForm } from '@/components/lists/viewer-form';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';

/**
 * **El directorio de accesos** de la iglesia (RFC 0010 §8.5, D19).
 *
 * Vive en ajustes y no colgando de una lista porque un acceso **es de la
 * iglesia**: abre las listas que se le concedan, y aquí se contesta «¿a qué
 * llega Juan?» sin recorrer siete listas.
 */
export function ListAccessPage() {
  const { t } = useTranslation();
  const { data: viewers, isLoading } = useListViewers(api);
  const { data: lists = [] } = useLists(api);
  const [creando, setCreando] = useState(false);
  const [abierto, setAbierto] = useState<ListViewer | null>(null);

  if (isLoading || !viewers) return <PageSkeleton />;

  return (
    <section className="gap-6 max-w-3xl animate-page-in flex flex-col">
      <BackLink to="/settings" label={t('nav.settings')} />

      <header className="gap-4 flex flex-wrap items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('lists.accessTitle')}</h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
            {t('lists.accessSubtitle')}
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setCreando(true);
          }}
        >
          <UserPlus size={16} aria-hidden />
          {t('lists.newViewer')}
        </Button>
      </header>

      {viewers.length === 0 ? (
        <EmptyState icon={KeyRound} title={t('lists.noViewers')}>
          {t('lists.accessEmptyBody')}
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {viewers.map((viewer) => (
            <ViewerDirectoryRow
              key={viewer.id}
              viewer={viewer}
              lists={lists}
              onOpen={() => {
                setAbierto(viewer);
              }}
            />
          ))}
        </ul>
      )}

      <ViewerForm
        open={creando}
        onClose={() => {
          setCreando(false);
        }}
        listName={t('lists.title')}
        url=""
      />

      <ViewerDetailDialog
        viewer={abierto ? (viewers.find((one) => one.id === abierto.id) ?? null) : null}
        lists={lists}
        onClose={() => {
          setAbierto(null);
        }}
      />
    </section>
  );
}
