import {
  useListMemberships,
  useListViewers,
  useLists,
  useRemoveListMember,
} from '@navis/api-client';
import type { Believer } from '@navis/shared';
import { ClipboardList, KeyRound, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ViewerForm } from '@/components/lists/viewer-form';
import { VisibilityBadge } from '@/components/lists/visibility-badge';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { usePermissions } from '@/lib/permissions';

/**
 * **«Está en» y «Puede ver»**, en la ficha de una persona (RFC 0010 §8.7).
 *
 * Dos bloques que no se mezclan, y así es como se entiende D21 sin explicarla:
 * estar en una lista y poder verla son cosas distintas. Las listas publicadas
 * llevan su pastilla, porque quien mira una ficha tiene que ver de un vistazo
 * que ese nombre está hoy en internet.
 */
export function BelieverAccess({ believer }: { believer: Believer }) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const puedeVer = can('lists.view');
  const puedeCompartir = can('lists.share');

  const { data: lists = [] } = useLists(api, puedeVer);
  const { data: memberships = {} } = useListMemberships(api, puedeVer);
  const { data: viewers = [] } = useListViewers(api, puedeCompartir);
  const remove = useRemoveListMember(api);
  const [creando, setCreando] = useState(false);

  if (!puedeVer) return null;

  const suyas = lists.filter((one) => memberships[believer.id]?.includes(one.id));
  const acceso = viewers.find((one) => one.believerId === believer.id);

  return (
    <section className="gap-5 p-5 flex flex-col rounded-xl border bg-card">
      <div className="gap-2 flex flex-col">
        <h2 className="gap-1.5 text-sm font-semibold flex items-center">
          <ClipboardList size={15} aria-hidden />
          {t('lists.inLists')}
        </h2>

        {suyas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('lists.emptyList')}</p>
        ) : (
          <ul className="gap-1 flex flex-col">
            {suyas.map((one) => (
              <li key={one.id} style={accentVars(one.accent)} className="gap-2 flex items-center">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--acento)]" />
                <Link
                  to={`/lists/${one.slug}`}
                  className="text-sm truncate underline-offset-4 hover:underline"
                >
                  {one.name}
                </Link>
                {one.visibility !== 'private' && <VisibilityBadge visibility={one.visibility} />}

                {can('lists.manage') && (
                  <button
                    type="button"
                    aria-label={t('lists.removeMember', { name: one.name })}
                    className="size-7 ml-auto inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      remove.mutate({ listId: one.id, believerId: believer.id });
                    }}
                  >
                    <X size={14} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {puedeCompartir && (
        <div className="gap-2 pt-4 flex flex-col border-t">
          <h2 className="gap-1.5 text-sm font-semibold flex items-center">
            <KeyRound size={15} aria-hidden />
            {t('lists.canSee')}
          </h2>

          {acceso ? (
            <div className="gap-1 flex flex-col">
              <p className="text-sm">{acceso.username}</p>
              <p className="text-xs text-muted-foreground">
                {acceso.lastSeenAt
                  ? formatDateTime(acceso.lastSeenAt)
                  : t('lists.neverEnteredShort')}
                {' · '}
                {t('lists.reachesLists', { count: acceso.listIds.length })}
              </p>
              <Link
                to="/settings/access"
                className="text-xs self-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t('lists.directory')}
              </Link>
            </div>
          ) : (
            <div className="gap-2 flex flex-col items-start">
              <p className="text-sm text-muted-foreground">{t('lists.noAccessYet')}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCreando(true);
                }}
              >
                <KeyRound size={14} aria-hidden />
                {t('lists.newViewer')}
              </Button>
            </div>
          )}
        </div>
      )}

      <ViewerForm
        open={creando}
        onClose={() => {
          setCreando(false);
        }}
        listName={t('lists.title')}
        url=""
        believer={believer}
      />
    </section>
  );
}
