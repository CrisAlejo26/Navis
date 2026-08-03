import type { ManagedUser } from '@navis/shared';

/**
 * Qué ventana de una cuenta está abierta. Solo una a la vez, así que se guarda
 * en un único estado en vez de en cuatro banderas sueltas.
 *
 * Vive aparte del componente porque exportar constantes junto a componentes
 * rompe la recarga en caliente de React.
 */
export interface UserDialogsState {
  creating: boolean;
  editing: ManagedUser | null;
  changingPassword: ManagedUser | null;
  deleting: ManagedUser | null;
}

export const NO_DIALOG: UserDialogsState = {
  creating: false,
  editing: null,
  changingPassword: null,
  deleting: null,
};
