import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const USERS_FILTER_STORAGE_KEY = 'navis.usersFilter';

interface UsersFilterState {
  /** La iglesia por la que se está filtrando, o `null` para todas las accesibles. */
  churchId: string | null;
  setChurch: (churchId: string | null) => void;
}

/**
 * Por qué iglesia se están mirando las cuentas.
 *
 * Se guarda entre sesiones —y no en la URL, como el resto de filtros de la
 * tabla— porque no es un filtro de un rato: quien administra varias iglesias
 * trabaja durante días sobre una, y volver a elegirla en cada visita es la
 * clase de fricción que acaba en «mejor lo miro luego».
 *
 * Si la guardada deja de ser accesible, el servidor devuelve una página vacía y
 * la interfaz ofrece volver a todas: no se corrige a la brava, porque una lista
 * que cambia sola de filtro engaña más que una vacía.
 */
export const useUsersFilterStore = create<UsersFilterState>()(
  persist(
    (set) => ({
      churchId: null,
      setChurch: (churchId) => {
        set({ churchId });
      },
    }),
    {
      name: USERS_FILTER_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
