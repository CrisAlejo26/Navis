import { useListViewers } from '@navis/api-client';
import type { List } from '@navis/shared';
import { KeyRound, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { BulkGrantDialog } from '@/components/lists/bulk-grant-dialog';
import { ViewerForm } from '@/components/lists/viewer-form';
import { ViewerRows } from '@/components/lists/viewer-rows';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

/**
 * **Quién puede verla**, solo en modo restringido (RFC 0010 §8.5 punto 3).
 *
 * Los dos botones del pie son los que ahorran el trabajo de verdad: crear un
 * acceso y concedérselo de una vez, y dar acceso a los de esta lista (D29). Los
 * dos son gestos explícitos: añadir a alguien a una lista **no** le da acceso
 * (D21).
 */
export function ShareViewersBlock({ list, url }: { list: List; url: string }) {
  const { t } = useTranslation();
  const { data: viewers = [] } = useListViewers(api);
  const [creando, setCreando] = useState(false);
  const [lote, setLote] = useState(false);

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex flex-wrap items-baseline justify-between">
        <h3 className="gap-1.5 text-sm font-medium flex items-center">
          <KeyRound size={14} aria-hidden />
          {t('lists.whoCanSee')}
        </h3>
        <Link
          to="/settings/access"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('lists.directory')}
        </Link>
      </div>

      <ViewerRows listId={list.id} viewers={viewers} />

      <div className="gap-2 flex flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCreando(true);
          }}
        >
          <UserPlus size={14} aria-hidden />
          {t('lists.newViewer')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLote(true);
          }}
        >
          <Users size={14} aria-hidden />
          {t('lists.grantAllInList')}
        </Button>
      </div>

      <ViewerForm
        open={creando}
        onClose={() => {
          setCreando(false);
        }}
        listId={list.id}
        listName={list.name}
        url={url}
      />

      <BulkGrantDialog
        open={lote}
        onClose={() => {
          setLote(false);
        }}
        listId={list.id}
        listName={list.name}
        url={url}
      />
    </div>
  );
}
