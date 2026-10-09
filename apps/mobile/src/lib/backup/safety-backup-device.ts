import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { deviceBackupFiles } from './backup-files';
import type { BackupOrigin } from './backup-format';
import {
    createSafetyBackup,
    type SafetyCopy,
    type SafetyReason,
    type SafetyStore,
} from './safety-backup';

const FOLDER = 'safety';

function directory(): Directory {
    const dir = new Directory(Paths.document, FOLDER);
    dir.create({ intermediates: true, idempotent: true });
    return dir;
}

/** Las copias previas, en `Documentos/safety/` (privado de la app). */
export const deviceSafetyStore: SafetyStore = {
    write: (name, text) => {
        const file = new File(directory(), name);
        file.create({ overwrite: true });
        file.write(text);
        return Promise.resolve();
    },
    read: async (name) => {
        const file = new File(directory(), name);
        return file.exists ? file.text() : null;
    },
    list: () =>
        Promise.resolve(
            directory()
                .list()
                .map((entry) => entry.name),
        ),
    remove: (name) => {
        const file = new File(directory(), name);
        if (file.exists) file.delete();
        return Promise.resolve();
    },
    uri: (name) => new File(directory(), name).uri,
};

export const deviceOrigin = (): BackupOrigin => ({
    appVersion: Constants.expoConfig?.version ?? 'desconocida',
    platform: Platform.OS,
});

/** La copia previa de este teléfono: si no se puede dejar verificada, lanza y la operación no sigue. */
export function ensureSafetyBackup(reason: SafetyReason): Promise<SafetyCopy> {
    return createSafetyBackup(reason, deviceBackupFiles, deviceSafetyStore, deviceOrigin());
}
