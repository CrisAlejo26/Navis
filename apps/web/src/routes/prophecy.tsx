import { useProphecy, useUpdateProphecy } from '@navis/api-client';
import { todayIn, type ProphecyFulfillment } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { DeleteFulfillmentDialog } from '@/components/prophecies/delete-fulfillment-dialog';
import { DeleteProphecyDialog } from '@/components/prophecies/delete-prophecy-dialog';
import { FulfillmentCards } from '@/components/prophecies/fulfillment-cards';
import { FulfillmentForm } from '@/components/prophecies/fulfillment-form';
import { FulfillmentList } from '@/components/prophecies/fulfillment-list';
import { MarkFulfilledDialog } from '@/components/prophecies/mark-fulfilled-dialog';
import { ProphecyForm } from '@/components/prophecies/prophecy-form';
import { ProphecyIdentity } from '@/components/prophecies/prophecy-identity';
import { ProphecyJourney } from '@/components/prophecies/prophecy-journey';
import { ProphecyViewSwitch } from '@/components/prophecies/prophecy-view-switch';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { useProphecyDetailViewStore } from '@/lib/prophecies/detail-view';
import { toast } from '@/lib/toast';

/**
 * La ficha de una profecía (RFC 0004 D12, §7.6).
 *
 * Es una ruta y no un panel lateral: se comparte por enlace, se abre en otra
 * pestaña y tiene sitio para un texto largo y para años de cumplimientos.
 *
 * La columna derecha se lee de **cuatro formas**, y cada una responde a una
 * pregunta distinta: qué ha pasado en orden, déjame releerla, cuándo pasó cada
 * cosa, y enséñamelo todo a la vez.
 */
export function ProphecyPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: prophecy, isLoading } = useProphecy(api, id);
  const update = useUpdateProphecy(api);
  const view = useProphecyDetailViewStore((state) => state.view);

  const [editing, setEditing] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [marking, setMarking] = useState(false);
  const [editingFulfillment, setEditingFulfillment] = useState<ProphecyFulfillment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingFulfillment, setDeletingFulfillment] = useState<ProphecyFulfillment | null>(null);

  if (isLoading || !prophecy) return <PageSkeleton />;

  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  /** Reabrir es quitar la fecha; los cumplimientos no se tocan (D6). */
  const reopen = () => {
    update.mutate(
      { id: prophecy.id, fulfilledAt: null },
      {
        onSuccess: () => {
          toast.success(t('prophecies.reopened'));
        },
      },
    );
  };

  return (
    <section className="gap-6 lg:grid-cols-[20rem_1fr] animate-page-in grid">
      <ProphecyIdentity
        prophecy={prophecy}
        today={today}
        onEdit={() => {
          setEditing(true);
        }}
        onFulfill={() => {
          setFulfilling(true);
        }}
        onMarkFulfilled={() => {
          setMarking(true);
        }}
        onReopen={reopen}
        onDelete={() => {
          setDeleting(true);
        }}
      />

      <div className="gap-4 min-w-0 flex flex-col">
        <div className="flex justify-end">
          <ProphecyViewSwitch />
        </div>

        {/* La clave remonta al cambiar de vista y relanza la animación: es un
            fundido, sin desplazamiento —no se está yendo a otro sitio— (§7.8). */}
        <div key={view} className="gap-6 flex flex-col">
          {view !== 'recorrido' && (
            <article
              style={{ animationDelay: '40ms' }}
              className="p-4 sm:p-6 animate-rise-in rounded-xl border bg-card"
            >
              <p
                className={
                  view === 'lectura'
                    ? 'max-w-prose text-[17px] leading-[1.75] whitespace-pre-wrap'
                    : 'max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap'
                }
              >
                {prophecy.body}
              </p>
            </article>
          )}

          {view === 'bitacora' && (
            <section
              style={{ animationDelay: '120ms' }}
              className="gap-3 animate-rise-in flex flex-col"
            >
              <h2 className="text-sm font-medium">{t('prophecies.fulfillments')}</h2>
              <FulfillmentList
                fulfillments={prophecy.fulfillments}
                onEdit={setEditingFulfillment}
                onDelete={setDeletingFulfillment}
              />
            </section>
          )}

          {view === 'fichas' && (
            <section
              style={{ animationDelay: '120ms' }}
              className="gap-3 animate-rise-in flex flex-col"
            >
              <h2 className="text-sm font-medium">{t('prophecies.fulfillments')}</h2>
              <FulfillmentCards
                fulfillments={prophecy.fulfillments}
                onEdit={setEditingFulfillment}
                onDelete={setDeletingFulfillment}
              />
            </section>
          )}

          {view === 'recorrido' && <ProphecyJourney prophecy={prophecy} today={today} />}
        </div>
      </div>

      {editing && (
        <ProphecyForm
          open
          prophecyId={prophecy.id}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      {(fulfilling || editingFulfillment) && (
        <FulfillmentForm
          open
          prophecyId={prophecy.id}
          fulfillment={editingFulfillment ?? undefined}
          onClose={() => {
            setFulfilling(false);
            setEditingFulfillment(null);
          }}
        />
      )}

      <MarkFulfilledDialog
        prophecy={marking ? prophecy : null}
        onClose={() => {
          setMarking(false);
        }}
      />

      <DeleteProphecyDialog
        prophecy={deleting ? prophecy : null}
        onClose={() => {
          setDeleting(false);
        }}
        onDeleted={() => {
          void navigate('/prophecies/list');
        }}
      />

      <DeleteFulfillmentDialog
        prophecyId={prophecy.id}
        fulfillment={deletingFulfillment}
        onClose={() => {
          setDeletingFulfillment(null);
        }}
      />
    </section>
  );
}
