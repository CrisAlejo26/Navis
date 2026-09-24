import { create } from 'zustand';

/**
 * Qué calendario se está mirando y en qué tramo. Vive fuera de la pantalla
 * para que volver a la pestaña no pierda el sitio: igual que la web guarda la
 * vista en la URL, aquí la app guarda la elección en memoria de sesión.
 */
interface ActiveCalendarState {
    calendarId: string | null;
    /** El ancla del tramo: cualquier día del mes que se está mirando. */
    anchor: string;
    setCalendar: (calendarId: string) => void;
    setAnchor: (anchor: string) => void;
}

export const useActiveCalendarStore = create<ActiveCalendarState>()((set) => ({
    calendarId: null,
    anchor: '',
    setCalendar: (calendarId) => set({ calendarId }),
    setAnchor: (anchor) => set({ anchor }),
}));
