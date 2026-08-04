import { useGifts } from '@navis/api-client';
import type { Gift } from '@navis/shared';
import { ChevronLeft, Plus, Sprout } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DeleteGiftDialog } from '@/components/believers/delete-gift-dialog';
import { GiftForm } from '@/components/believers/gift-form';
import { GiftRows } from '@/components/believers/gift-rows';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';

/**
 * El catálogo de dones de la iglesia (§7.2, D5).
 *
 * Cuelga de creyentes y no de los ajustes generales porque es vocabulario de
 * esta sección: se abre desde la ficha o desde el listado, cuando hace falta
 * uno que no está.
 */
export function GiftsPage() {
  const { t } = useTranslation();
  const { data: gifts = [] } = useGifts(api);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [deleting, setDeleting] = useState<Gift | null>(null);

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
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('gifts.title')}</h1>
          <Button
            variant="secondary"
            size="md"
            className="sm:self-auto self-start"
            onClick={() => {
              setAdding(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('gifts.add')}
          </Button>
        </div>

        <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('gifts.description')}</p>
      </div>

      <Card>
        {gifts.length === 0 ? (
          <EmptyState icon={Sprout} title={t('gifts.empty')} />
        ) : (
          <GiftRows gifts={gifts} onEdit={setEditing} onDelete={setDeleting} />
        )}
      </Card>

      {(adding || editing) && (
        <GiftForm
          open
          gift={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteGiftDialog
        gift={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}
