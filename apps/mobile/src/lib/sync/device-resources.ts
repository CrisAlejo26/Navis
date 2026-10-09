import * as Battery from 'expo-battery';
import { Paths } from 'expo-file-system';

import { shouldDeferForBattery } from './resources';

/** Espacio libre del teléfono, en bytes. */
export const deviceFreeSpace = (): number => Paths.availableDiskSpace;

/**
 * Si una vuelta automática debe esperar por batería baja. Si el sistema no sabe
 * decirlo (emulador, plataforma sin soporte), no frena: no sincronizar por una
 * lectura que falla sería peor que sincronizar.
 */
export async function deferForBattery(): Promise<boolean> {
    try {
        const [level, state] = await Promise.all([
            Battery.getBatteryLevelAsync(),
            Battery.getBatteryStateAsync(),
        ]);
        const charging =
            state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
        return shouldDeferForBattery(level, charging, false);
    } catch {
        return false;
    }
}
