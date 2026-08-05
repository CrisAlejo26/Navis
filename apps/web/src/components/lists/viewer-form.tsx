import { useCreateListViewer, useLists } from '@navis/api-client';
import {
  generateListPassword,
  proposeListUsername,
  type ListCredentialSheetRow,
} from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CredentialsPanel } from '@/components/lists/credentials-panel';
import { GrantCheckboxes } from '@/components/lists/grant-checkboxes';
import { ViewerFormFields, type ViewerDraft } from '@/components/lists/viewer-form-fields';
import type { PickableBeliever } from '@/components/lists/viewer-believer-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';

/**
 * **El diálogo de crear un acceso**: donde se nota si esto está bien hecho
 * (RFC 0010 §8.5).
 *
 * De un creyente o de un grupo, con el usuario propuesto, la contraseña ya
 * generada y **las casillas de todas las listas de la iglesia** con la actual
 * marcada: se crea un acceso y se le dan las cuatro listas de una vez (D19).
 *
 * Al guardar no se cierra: enseña usuario y contraseña juntos con el botón que
 * copia el mensaje ya redactado, porque esa contraseña no se va a volver a ver
 * (D24).
 */
export function ViewerForm({
  open,
  onClose,
  listId,
  listName,
  url,
  believer,
}: {
  open: boolean;
  onClose: () => void;
  /** La lista desde la que se abre, ya marcada. Sin ella, ninguna. */
  listId?: string;
  listName: string;
  url: string;
  /** La persona ya elegida, cuando se abre desde su ficha (D20, §8.7). */
  believer?: PickableBeliever;
}) {
  const { t } = useTranslation();
  const { data: lists = [] } = useLists(api, open);
  const create = useCreateListViewer(api);

  const [draft, setDraft] = useState<ViewerDraft>(() => nuevo(believer));
  const [grants, setGrants] = useState<string[]>(listId ? [listId] : []);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<ListCredentialSheetRow[] | null>(null);

  const cerrar = () => {
    setHecho(null);
    setDraft(nuevo(believer));
    setGrants(listId ? [listId] : []);
    setError(null);
    onClose();
  };

  const guardar = () => {
    setError(null);

    create.mutate(
      {
        label: draft.label.trim(),
        username: draft.username.trim().toLowerCase(),
        password: draft.password,
        believerId: draft.deCreyente ? (draft.believer?.id ?? null) : null,
        listIds: grants,
      },
      {
        onSuccess: ({ viewer }) => {
          setHecho([{ name: viewer.label, username: viewer.username, password: draft.password }]);
        },
        onError: (cause: Error) => {
          setError(cause.message);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      title={t('lists.newViewer')}
      width="min(34rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        {hecho ? (
          <>
            <CredentialsPanel rows={hecho} listName={listName} url={url} />
            <Button size="lg" className="w-full" onClick={cerrar}>
              {t('common.close')}
            </Button>
          </>
        ) : (
          <>
            <ViewerFormFields draft={draft} onChange={setDraft} />

            <GrantCheckboxes
              lists={lists}
              selected={grants}
              onChange={setGrants}
              label={t('lists.grantLists')}
            />

            <FormError message={error} />

            <Button size="lg" className="w-full" isLoading={create.isPending} onClick={guardar}>
              {t('lists.newViewer')}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}

/** El borrador inicial: con la persona ya elegida cuando se abre desde su ficha. */
function nuevo(believer: PickableBeliever | undefined): ViewerDraft {
  const name = believer ? `${believer.firstName} ${believer.lastName}`.trim() : '';

  return {
    deCreyente: true,
    believer: believer ?? null,
    label: name,
    username: name ? proposeListUsername(name) : '',
    password: generateListPassword(),
  };
}
