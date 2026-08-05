import { useBeliever, useCongregations, useGifts } from '@navis/api-client';
import { todayIn } from '@navis/shared';
import { UserSearch } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { BelieverForm } from '@/components/believers/believer-form';
import { BelieverIdentity } from '@/components/believers/believer-identity';
import { BelieverLog } from '@/components/believers/believer-log';
import { DeleteBelieverDialog } from '@/components/believers/delete-believer-dialog';
import { BackLink } from '@/components/ui/back-link';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';

/**
 * La ficha de un hermano y su bitácora (RFC 0003 §7.5).
 *
 * Es una ruta y no un panel lateral (D12): `/believers/:id` se comparte por
 * enlace, se abre en otra pestaña y tiene sitio para un historial largo. Dos
 * columnas de `lg` para arriba —quién es a la izquierda, qué se ha escrito de
 * él a la derecha— y una sola por debajo.
 */
export function BelieverPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can('believers.manage');

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [writing, setWriting] = useState(false);

  const { data: believer, isLoading, isError } = useBeliever(api, id);
  const { data: congregations = [] } = useCongregations(api);
  const { data: gifts = [] } = useGifts(api);

  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  if (isLoading) return <PageSkeleton />;

  if (isError || !believer) {
    return (
      <EmptyState icon={UserSearch} title={t('believers.notFound')}>
        <Link to="/believers" className="text-primary underline-offset-2 hover:underline">
          {t('believers.backToList')}
        </Link>
      </EmptyState>
    );
  }

  return (
    <section className="gap-5 flex flex-col">
      <BackLink to="/believers" label={t('believers.backToList')} />

      {/* A lo ancho y de arriba abajo, como la ficha de un sueño: la cabecera
          teñida primero y debajo la bitácora con sus formas de verla. */}
      <div className="gap-4 flex flex-col">
        <BelieverIdentity
          believer={believer}
          congregation={congregations.find((one) => one.id === believer.congregationId)}
          today={today}
          canManage={canManage}
          onNote={() => {
            setWriting(true);
          }}
          onEdit={() => {
            setEditing(true);
          }}
          onDelete={() => {
            setDeleting(true);
          }}
        />

        <BelieverLog
          believerId={believer.id}
          name={believer.firstName}
          gifts={gifts}
          today={today}
          canManage={canManage}
          writing={writing}
          onWritingChange={setWriting}
        />
      </div>

      {editing && (
        <BelieverForm
          open
          believer={believer}
          congregations={congregations}
          gifts={gifts}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      <DeleteBelieverDialog
        believer={deleting ? believer : null}
        onClose={() => {
          setDeleting(false);
        }}
        onDeleted={() => {
          void navigate('/believers');
        }}
      />
    </section>
  );
}
