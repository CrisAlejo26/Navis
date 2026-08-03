import { CreateUserDialog } from '@/components/access/create-user-dialog';
import { DeleteUserDialog } from '@/components/access/delete-user-dialog';
import { EditUserDialog } from '@/components/access/edit-user-dialog';
import { SetPasswordDialog } from '@/components/access/set-password-dialog';
import type { UserDialogsState } from '@/lib/user-dialogs-state';

/**
 * Las cuatro ventanas que actúan sobre una cuenta, en un solo sitio. La tabla
 * dice cuál abrir y no tiene que saber nada de cada una.
 */
export function UserDialogs({ state, onClose }: { state: UserDialogsState; onClose: () => void }) {
  return (
    <>
      <CreateUserDialog open={state.creating} onClose={onClose} />
      <EditUserDialog user={state.editing} onClose={onClose} />
      <SetPasswordDialog user={state.changingPassword} onClose={onClose} />
      <DeleteUserDialog user={state.deleting} onClose={onClose} />
    </>
  );
}
