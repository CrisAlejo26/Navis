import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const USERS_FILTER_STORAGE_KEY = 'navis.usersFilter';

interface UsersFilterState {
  /** Iglesias por las que se filtra. Vacío es «todas las accesibles». */
  churchIds: string[];
  /** Marca o desmarca una; el resto se queda como estaba. */
  toggleChurch: (churchId: string) => void;
  /** Vuelve a todas. */
  clearChurches: () => void;
}

/**
 * Por qué iglesias se están mirando las cuentas.
 *
 * Se guarda entre sesiones —y no en la URL, como el resto de filtros de la
 * tabla— porque no es un filtro de un rato: quien administra varias iglesias
 * trabaja durante días sobre las mismas, y volver a elegirlas en cada visita es
 * la clase de fricción que acaba en «mejor lo miro luego».
 *
 * Si alguna guardada deja de ser accesible, el servidor la ignora al calcular
 * el alcance: una preferencia vieja no da error, simplemente deja de sumar.
 */
export const useUsersFilterStore = create<UsersFilterState>()(
  persist(
    (set) => ({
      churchIds: [],
      toggleChurch: (churchId) => {
        set((state) => ({
          churchIds: state.churchIds.includes(churchId)
            ? state.churchIds.filter((id) => id !== churchId)
            : [...state.churchIds, churchId],
        }));
      },
      clearChurches: () => {
        set({ churchIds: [] });
      },
    }),
    {
      name: USERS_FILTER_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
