import type { TeachingListItem } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteTeachingDialog } from '@/components/teachings/delete-teaching-dialog';
import type { TeachingCells } from '@/components/teachings/teaching-row';
import { TeachingForm } from '@/components/teachings/teaching-form';
import { TeachingsTable } from '@/components/teachings/teachings-table';
import { TeachingsToolbar } from '@/components/teachings/teachings-toolbar';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { useTeachingsScreen } from '@/lib/teachings/use-teachings-screen';

/** El listado de enseñanzas, en tabla o en fichas según el ancho (Regla 5). */
export function TeachingsListPage() {
  const { t } = useTranslation();
  const screen = useTeachingsScreen();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TeachingListItem | null>(null);
  const [deleting, setDeleting] = useState<TeachingListItem | null>(null);

  const cells = (teaching: TeachingListItem, index: number): TeachingCells => ({
    teaching,
    index,
    onEdit: () => {
      setEditing(teaching);
    },
    onDelete: () => {
      setDeleting(teaching);
    },
  });

  return (
    <section className="gap-4 flex flex-col">
      <BackLink to="/teachings" label={t('teachings.title')} />

      <header className="gap-3 sm:flex-row sm:items-center sm:justify-between flex flex-col">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('teachings.title')}</h1>
        <Button
          size="lg"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus size={18} aria-hidden />
          {t('teachings.add')}
        </Button>
      </header>

      <TeachingsTable
        screen={screen}
        cells={cells}
        toolbar={<TeachingsToolbar screen={screen} />}
      />

      {(creating || editing) && (
        <TeachingForm
          open
          teachingId={editing?.id}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteTeachingDialog
        teaching={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
