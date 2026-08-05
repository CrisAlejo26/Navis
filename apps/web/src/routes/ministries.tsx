import { useMinistries } from '@navis/api-client';
import type { MinistryCatalog } from '@navis/shared';
import { HandHeart, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteMinistryDialog } from '@/components/believers/delete-ministry-dialog';
import { MinistryForm } from '@/components/believers/ministry-form';
import { MinistryRows } from '@/components/believers/ministry-rows';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';

/**
 * El catálogo de **labores** de la iglesia.
 *
 * Gemelo del de dones: cuelga de creyentes y no de los ajustes generales
 * porque es vocabulario de esta sección, y se abre desde la ficha o desde el
 * listado cuando hace falta una que no está.
 *
 * Lo que se guarda en cada persona es el `slug`, no la fila: renombrar una
 * labor cambia el rótulo en todas partes y no mueve ni una programación.
 */
export function MinistriesPage() {
  const { t } = useTranslation();
  const { data: ministries = [] } = useMinistries(api);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MinistryCatalog | null>(null);
  const [deleting, setDeleting] = useState<MinistryCatalog | null>(null);

  return (
    <section className="max-w-2xl gap-6 flex flex-col">
      <div>
        <BackLink to="/believers" label={t('believers.backToList')} />

        <div className="gap-3 mt-2 sm:flex-row sm:items-center sm:justify-between flex flex-col">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('ministries.title')}</h1>
          <Button
            variant="secondary"
            size="md"
            className="sm:self-auto self-start"
            onClick={() => {
              setAdding(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('ministries.add')}
          </Button>
        </div>

        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {t('ministries.description')}
        </p>
      </div>

      <Card>
        {ministries.length === 0 ? (
          <EmptyState icon={HandHeart} title={t('ministries.empty')} />
        ) : (
          <MinistryRows ministries={ministries} onEdit={setEditing} onDelete={setDeleting} />
        )}
      </Card>

      {(adding || editing) && (
        <MinistryForm
          open
          ministry={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteMinistryDialog
        ministry={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
