import { useAddListMembers, useBelievers } from '@navis/api-client';
import { believerName, type BelieversQuery } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddMembersFilters } from '@/components/lists/add-members-filters';
import { BelieverPhoto } from '@/components/believers/believer-photo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Añadir personas a una lista **desde el listado de creyentes**, marcándolas
 * (RFC 0010 D5).
 *
 * El filtro es la herramienta y la pertenencia es la decisión: se filtra por
 * labor, sede, don o estado, se marca a quien interese y se añade. Lo que **no**
 * hay es una lista que se rellene sola con un filtro, porque eso reescribe a
 * espaldas de quien colgó el cartel.
 */
export function AddMembersDialog({
  open,
  onClose,
  listId,
  already,
}: {
  open: boolean;
  onClose: () => void;
  listId: string;
  /** Quién está ya dentro: sale marcado y deshabilitado, no escondido. */
  already: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<BelieversQuery>({ limit: 100 });
  const [marcados, setMarcados] = useState<string[]>([]);
  const { data: page, isLoading } = useBelievers(api, query, open);
  const add = useAddListMembers(api);

  const cerrar = () => {
    setMarcados([]);
    onClose();
  };

  const guardar = () => {
    add.mutate(
      { listId, believerIds: marcados },
      {
        onSuccess: () => {
          toast.success(t('lists.membersAdded', { count: marcados.length }));
          cerrar();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      title={t('lists.addPeople')}
      width="min(44rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        <AddMembersFilters query={query} onChange={setQuery} />

        <ul className="min-h-40 max-h-[50dvh] overflow-y-auto rounded-lg border">
          {isLoading && (
            <li className="p-4 text-sm text-muted-foreground">{t('common.loading')}</li>
          )}

          {page?.items.map((person) => {
            const dentro = already.has(person.id);

            return (
              <li key={person.id} className="px-3 gap-3 flex items-center border-b last:border-b-0">
                <BelieverPhoto believer={person} />
                <Checkbox
                  className="order-first"
                  disabled={dentro}
                  checked={dentro || marcados.includes(person.id)}
                  label={`${believerName(person)}${dentro ? ` · ${t('lists.alreadyIn')}` : ''}`}
                  onChange={(event) => {
                    setMarcados((current) =>
                      event.target.checked
                        ? [...current, person.id]
                        : current.filter((one) => one !== person.id),
                    );
                  }}
                />
              </li>
            );
          })}

          {page?.items.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">{t('believers.noResults')}</li>
          )}
        </ul>

        <Button
          size="lg"
          className="w-full"
          disabled={marcados.length === 0}
          isLoading={add.isPending}
          onClick={guardar}
        >
          {t('lists.addSelected', { count: marcados.length })}
        </Button>
      </div>
    </Dialog>
  );
}
