import { ApiError, useCreateRole, useUpdateRole } from '@navis/api-client';
import { createRoleSchema, isPermission, SUPERADMIN_ROLE, type RoleRow } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleFields } from '@/components/access/role-fields';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

interface RoleDialogProps {
  /** `null` para crear; una fila del catálogo para editarla. */
  role: RoleRow | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Alta y edición de un rol, en el mismo formulario: los campos son los mismos
 * y solo cambia a dónde va.
 */
export function RoleDialog({ role, open, onClose }: RoleDialogProps) {
  const { t } = useTranslation();
  const createRole = useCreateRole(api);
  const updateRole = useUpdateRole(api);
  const [error, setError] = useState<string | null>(null);

  const isEditing = role !== null;
  const isPending = createRole.isPending || updateRole.isPending;

  const close = () => {
    setError(null);
    onClose();
  };

  const onError = (cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 409) setError(t('roles.nameTaken'));
    else if (cause instanceof ApiError && cause.status === 400) setError(cause.message);
    else setError(t('errors.generic'));
  };

  // Se cierra antes de avisar: el `<dialog>` vive en la capa superior del
  // navegador y taparía el aviso mientras siga abierto.
  const done = (message: string) => () => {
    close();
    toast.success(message);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = optionalText(form.get('description')) ?? null;
    // `getAll` devuelve `(File | string)[]`; de las casillas solo salen textos,
    // y `isPermission` deja fuera cualquier valor que no esté en el catálogo.
    const marked = form
      .getAll('permissions')
      .filter((value) => typeof value === 'string')
      .filter(isPermission);
    // Los del superadministrador no se envían: su formulario no los pinta y la
    // API los rechazaría (ver RoleAdminService).
    const permissions = role?.slug === SUPERADMIN_ROLE ? undefined : marked;

    if (role) {
      const changes = role.isSystem
        ? { id: role.id, description, permissions }
        : {
            id: role.id,
            name: formText(form.get('name')),
            description,
            level: Number(formText(form.get('level'))),
            permissions,
          };

      updateRole.mutate(changes, { onSuccess: done(t('roles.updated')), onError });
      return;
    }

    const parsed = createRoleSchema.safeParse({
      name: formText(form.get('name')),
      description: description ?? undefined,
      level: formText(form.get('level')),
      permissions: marked,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    createRole.mutate(parsed.data, { onSuccess: done(t('roles.roleCreated')), onError });
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={isEditing ? t('roles.editRole') : t('roles.newRole')}
      description={role ? `${t('roles.identifier')}: ${role.slug}` : undefined}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <RoleFields role={role} />

        <FormError message={error} />

        <div className="gap-2 mt-1 flex justify-end">
          <Button variant="ghost" onClick={close} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditing ? t('common.save') : t('roles.newRole')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
