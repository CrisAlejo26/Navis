import { gateOf, usePublicList } from '@navis/api-client';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { AccessGate } from '@/components/lists/access-gate';
import { ListPoster } from '@/components/lists/list-poster';
import { PublicBand } from '@/components/lists/public-band';
import { PublicFooter } from '@/components/lists/public-footer';
import { RollCall } from '@/components/lists/roll-call';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { accentVars } from '@/lib/accents';
import { formatDate } from '@/lib/format';
import { publicApi } from '@/lib/lists/public-api';

/**
 * **La página pública de una lista** (RFC 0010 §8.6, D40).
 *
 * La única pantalla de todo el proyecto que ve alguien que no ha iniciado
 * sesión, y tiene que parecer **algo que alguien ha puesto en la puerta**, no
 * una aplicación a la que te has colado: sin barra lateral, sin selector de
 * iglesia y sin «iniciar sesión» arriba a la derecha.
 *
 * El 401 no es un fallo: es la puerta, y viene con lo justo para pintarla.
 */
export function PublicListPage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const { data: list, error, isLoading } = usePublicList(publicApi, token);
  const poster = useRef<HTMLDivElement>(null);

  if (isLoading) return <PageSkeleton />;

  const gate = gateOf(error);
  if (gate) return <AccessGate gate={gate} token={token} />;

  if (!list) {
    return (
      <main className="px-6 py-20 max-w-md mx-auto text-center">
        <p className="text-sm text-muted-foreground">{t('lists.notFound')}</p>
      </main>
    );
  }

  return (
    <div style={accentVars(list.accent)} className="min-h-dvh bg-background text-foreground">
      <PublicBand churchName={list.churchName} name={list.name} accent={list.accent}>
        <p>
          {t('lists.people', { count: list.members.length })} ·{' '}
          {t('lists.updatedAt', { date: formatDate(list.updatedAt) })}
        </p>
        {list.description && <p className="mt-1 max-w-prose">{list.description}</p>}
      </PublicBand>

      <main className="px-6 py-10 sm:px-10 max-w-3xl mx-auto w-full">
        {list.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('lists.emptyList')}</p>
        ) : (
          <RollCall members={list.members} token={token} />
        )}

        <PublicFooter list={list} token={token} poster={poster} />
      </main>

      {/*
       * La lámina, fuera de la vista pero **dentro del documento**: el
       * rasterizador necesita un nodo medido de verdad, y `display: none` no lo
       * mide. Se saca con posición absoluta, no con `visibility`.
       */}
      <div aria-hidden className="top-0 pointer-events-none absolute -left-[9999px]">
        <ListPoster
          ref={poster}
          churchName={list.churchName}
          name={list.name}
          accent={list.accent}
          members={list.members}
          locked={false}
          lockedLabel={t('lists.lockedCover')}
        />
      </div>
    </div>
  );
}
