import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DENSITY_STORAGE_KEY = 'navis.calendarDensity';

export type Density = 'compact' | 'cosy';

interface DensityState {
  density: Density;
  setDensity: (density: Density) => void;
}

/**
 * Cuánto respira el calendario.
 *
 * Se persiste porque no es una preferencia de un rato: quien programa tres
 * sedes quiere verlo todo apretado, y quien solo consulta prefiere leerlo
 * cómodo. Volver a elegirlo en cada visita es fricción tonta.
 */
export const useDensityStore = create<DensityState>()(
  persist(
    (set) => ({
      density: 'cosy',
      setDensity: (density) => {
        set({ density });
      },
    }),
    {
      name: DENSITY_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
    },
  ),
);
