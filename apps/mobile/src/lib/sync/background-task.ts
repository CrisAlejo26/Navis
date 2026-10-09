import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { useSyncConnection } from '@/stores/sync-connection';

import { syncRunner } from './device-runner';

const TASK_NAME = 'navis.sync';

/** El sistema no promete más de una ejecución cada ~15 minutos, y solo cuando le conviene. */
const MINIMUM_INTERVAL_MINUTES = 15;

/**
 * La tarea de fondo es una **ayuda**: el sistema operativo decide cuándo la
 * ejecuta (y con la app cerrada, a veces no lo hace en horas). Lo que garantiza
 * no perder trabajo es la cola de SQLite, no esta tarea; con la app abierta el
 * planificador de primer plano sincroniza por su cuenta.
 *
 * `defineTask` tiene que ejecutarse al cargar el módulo (no dentro de un efecto):
 * en una ejecución sin interfaz el sistema busca la tarea por nombre antes de que
 * exista ningún componente.
 */
TaskManager.defineTask(TASK_NAME, async () => {
    try {
        // En una ejecución sin interfaz el almacén del vínculo aún no se ha leído de disco.
        await useSyncConnection.persist.rehydrate();
        await syncRunner.syncNow();
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export async function registerBackgroundSync(): Promise<void> {
    try {
        if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
        await BackgroundTask.registerTaskAsync(TASK_NAME, {
            minimumInterval: MINIMUM_INTERVAL_MINUTES,
        });
    } catch {
        // Sin soporte (Expo Go, simulador): el planificador de primer plano sigue funcionando.
    }
}

export async function unregisterBackgroundSync(): Promise<void> {
    try {
        if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) {
            await BackgroundTask.unregisterTaskAsync(TASK_NAME);
        }
    } catch {
        // Nada que deshacer.
    }
}
