import { useDream, useUpdateDream } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { DeleteDreamDialog } from '@/components/dreams/delete-dream-dialog';
import { DreamAudios } from '@/components/dreams/dream-audios';
import { DreamBody } from '@/components/dreams/dream-body';
import { DreamForm } from '@/components/dreams/dream-form';
import { DreamFulfillment } from '@/components/dreams/dream-fulfillment';
import { DreamIdentity } from '@/components/dreams/dream-identity';
import { DreamInterpretation } from '@/components/dreams/dream-interpretation';
import { DreamJourney } from '@/components/dreams/dream-journey';
import { DreamViewSwitch } from '@/components/dreams/dream-view-switch';
import { FulfillDialog } from '@/components/dreams/fulfill-dialog';
import { BackLink } from '@/components/ui/back-link';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { useDreamDetailViewStore } from '@/lib/dreams/detail-view';
import { toast } from '@/lib/toast';

/**
 * La ficha de un sueño (RFC 0005 §7.6).
 *
 * Es una ruta y no un panel lateral: se abre en otra pestaña, se guarda en
 * marcadores y tiene sitio para un texto largo.
 *
 * Se lee de **cuatro formas**, como la de una profecía, y cada una responde a
 * una pregunta distinta: enséñamelo todo, déjame releerlo, quiero trabajar su
 * significado, y qué ha pasado con él. La cabecera y la acción principal no
 * cambian con la vista: están siempre.
 */
export function DreamPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: dream, isLoading } = useDream(api, id);
  const update = useUpdateDream(api);
  const view = useDreamDetailViewStore((state) => state.view);

  const [editing, setEditing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading || !dream) return <PageSkeleton />;

  /** Reabrirlo es quitar la fecha, y se lleva por delante lo que significó (D10). */
  const reopen = () => {
    update.mutate(
      { id: dream.id, fulfilledAt: null },
      {
        onSuccess: () => {
          toast.success(t('dreams.reopened'));
        },
      },
    );
  };

  return (
    <section className="gap-4 animate-page-in flex flex-col">
      <BackLink to="/dreams/list" label={t('dreams.open')} />

      <DreamIdentity
        dream={dream}
        isReopening={update.isPending}
        onEdit={() => {
          setEditing(true);
        }}
        onDelete={() => {
          setDeleting(true);
        }}
        onFulfill={() => {
          setMarking(true);
        }}
        onReopen={reopen}
      />

      <div className="flex justify-end">
        <DreamViewSwitch />
      </div>

      {/* La clave remonta al cambiar de vista y relanza la animación: es un
          fundido, sin desplazamiento —no se está yendo a otro sitio— (§7.8). */}
      <div key={view} className="gap-4 flex flex-col">
        {view === 'completo' && (
          <div className="gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] grid items-start">
            <DreamBody dream={dream} />
            <div className="gap-4 flex flex-col">
              <DreamInterpretation dream={dream} />
              <DreamAudios audios={dream.audios} />
              <DreamFulfillment
                dream={dream}
                onEdit={() => {
                  setMarking(true);
                }}
              />
            </div>
          </div>
        )}

        {view === 'lectura' && <DreamBody dream={dream} size="lectura" />}

        {view === 'interpretacion' && (
          <div className="gap-4 xl:grid-cols-2 grid items-start">
            <DreamBody dream={dream} />
            <DreamInterpretation dream={dream} />
          </div>
        )}

        {view === 'recorrido' && <DreamJourney dream={dream} />}
      </div>

      {editing && (
        <DreamForm
          open
          dreamId={dream.id}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      <FulfillDialog
        dream={dream}
        open={marking}
        onClose={() => {
          setMarking(false);
        }}
      />

      <DeleteDreamDialog
        dream={deleting ? dream : null}
        onClose={() => {
          setDeleting(false);
        }}
        onDeleted={() => {
          void navigate('/dreams/list');
        }}
      />
    </section>
  );
}
