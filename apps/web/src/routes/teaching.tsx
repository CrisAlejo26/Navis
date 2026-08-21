import { useTeaching } from '@navis/api-client';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { DeleteTeachingDialog } from '@/components/teachings/delete-teaching-dialog';
import { TeachingBodyView } from '@/components/teachings/teaching-body-view';
import { TeachingForm } from '@/components/teachings/teaching-form';
import { TeachingIdentity } from '@/components/teachings/teaching-identity';
import { BackLink } from '@/components/ui/back-link';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';

/** La ficha de una enseñanza (RFC 0022 §6): la cabecera y el cuerpo, en lectura. */
export function TeachingPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: teaching, isLoading } = useTeaching(api, id);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading || !teaching) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <BackLink to="/teachings/list" label={teaching.title} />

      <TeachingIdentity
        teaching={teaching}
        onEdit={() => {
          setEditing(true);
        }}
        onDelete={() => {
          setDeleting(true);
        }}
      />

      <article
        style={{ animationDelay: '80ms' }}
        className="p-4 sm:p-6 animate-rise-in rounded-xl border bg-card"
      >
        <TeachingBodyView body={teaching.body} />
      </article>

      {editing && (
        <TeachingForm
          open
          teachingId={teaching.id}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      <DeleteTeachingDialog
        teaching={deleting ? teaching : null}
        onClose={() => {
          setDeleting(false);
        }}
        onDeleted={() => {
          void navigate('/teachings/list');
        }}
      />
    </section>
  );
}
