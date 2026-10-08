import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Los interruptores de avisos de **este teléfono**: el maestro y uno por tipo.
 * Encendidos de serie: el permiso del sistema se pide cuando hace falta (al
 * guardar el primer recordatorio, o al activar el interruptor), no al arrancar.
 */
interface NotificationSettingsState {
    enabled: boolean;
    noteReminders: boolean;
    taskReminders: boolean;
    setEnabled: (enabled: boolean) => void;
    setNoteReminders: (enabled: boolean) => void;
    setTaskReminders: (enabled: boolean) => void;
}

export const useNotificationSettings = create<NotificationSettingsState>()(
    persist(
        (set) => ({
            enabled: true,
            noteReminders: true,
            taskReminders: true,
            setEnabled: (enabled) => set({ enabled }),
            setNoteReminders: (noteReminders) => set({ noteReminders }),
            setTaskReminders: (taskReminders) => set({ taskReminders }),
        }),
        {
            name: 'navis:notification-settings',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
