import { useBelieverTags } from '@navis/api-client';
import type { BelieverTag } from '@navis/shared';
import { ChevronLeft, Plus, Tag } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { BelieverTagForm } from '@/components/believers/believer-tag-form';
import { BelieverTagRows } from '@/components/believers/believer-tag-rows';
import { DeleteBelieverTagDialog } from '@/components/believers/delete-believer-tag-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';

/**
 * El catálogo de etiquetas de creyente de la iglesia.
 *
 * Cuelga de creyentes y no de los ajustes generales, como dones y labores: es
 * vocabulario de esta sección, y se abre desde el listado cuando hace falta
 * una que no está —«En busca de trabajo», «Voluntario»…—.
 */
export function BelieverTagsPage() {
  const { t } = useTranslation();
  const { data: tags = [] } = useBelieverTags(api);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<BelieverTag | null>(null);
  const [deleting, setDeleting] = useState<BelieverTag | null>(null);

  return (
    <section className="max-w-2xl gap-6 flex flex-col">
      <div>
        <Link
          to="/believers"
          className="gap-1.5 text-sm -ml-1 inline-flex w-fit items-center rounded-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} aria-hidden />
          {t('believers.backToList')}
        </Link>

        <div className="gap-3 mt-2 sm:flex-row sm:items-center sm:justify-between flex flex-col">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('believerTags.title')}</h1>
          <Button
            variant="secondary"
            size="md"
            className="sm:self-auto self-start"
            onClick={() => {
              setAdding(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('believerTags.add')}
          </Button>
        </div>

        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {t('believerTags.description')}
        </p>
      </div>

      <Card>
        {tags.length === 0 ? (
          <EmptyState icon={Tag} title={t('believerTags.empty')} />
        ) : (
          <BelieverTagRows tags={tags} onEdit={setEditing} onDelete={setDeleting} />
        )}
      </Card>

      {(adding || editing) && (
        <BelieverTagForm
          open
          tag={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteBelieverTagDialog
        tag={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
