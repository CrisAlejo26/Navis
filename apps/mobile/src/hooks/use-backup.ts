import { useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { useState } from 'react';

import { findUser } from '@/data/repos/account-repo';
import { deviceBackupFiles } from '@/lib/backup/backup-files';
import { buildBackup } from '@/lib/backup/create-backup';
import { MIN_PASSWORD_LENGTH, sealPackage } from '@/lib/backup/package-crypto';
import { restoreBackup, RestoreError, type RestoreErrorCode } from '@/lib/backup/restore-backup';
import { deviceOrigin, ensureSafetyBackup } from '@/lib/backup/safety-backup-device';
import { useLocalSession } from '@/stores/local-session';

export type BackupErrorCode = RestoreErrorCode | 'generic' | 'exportFailed' | 'safetyFailed';

export type BackupOutcome =
    { kind: 'restored'; missingFiles: number } | { kind: 'error'; code: BackupErrorCode };

/** La copia exige contraseña: es lo que la cifra, y sin ella nadie la abre. */
export const isValidBackupPassword = (secret: string): boolean =>
    secret.length >= MIN_PASSWORD_LENGTH;

/**
 * Exportar y restaurar la copia de seguridad. Exportar cifra el paquete entero
 * con la contraseña; restaurar deja antes una copia verificada de lo que hay (si
 * no se puede, no restaura) y, al terminar, invalida la caché de consultas y,
 * si la sesión abierta ya no existe en la copia, vuelve a la bienvenida.
 */
export function useBackup() {
    const client = useQueryClient();
    const session = useLocalSession((state) => state.session);
    const clear = useLocalSession((state) => state.clear);
    const [busy, setBusy] = useState<'export' | 'restore' | null>(null);

    async function exportBackup(secret: string): Promise<BackupOutcome | null> {
        if (!isValidBackupPassword(secret)) return { kind: 'error', code: 'exportFailed' };
        setBusy('export');
        try {
            const backup = await buildBackup(deviceBackupFiles, secret, { origin: deviceOrigin() });
            const sealed = await sealPackage(JSON.stringify(backup), secret);
            const name = `navis-copia-${backup.createdAt.slice(0, 10)}.json`;
            const file = new File(Paths.cache, name);
            file.create({ overwrite: true });
            file.write(JSON.stringify(sealed));
            await shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: name });
            return null;
        } catch {
            return { kind: 'error', code: 'exportFailed' };
        } finally {
            setBusy(null);
        }
    }

    /** Abre el selector del sistema; `null` si se cancela. */
    async function pickBackup(): Promise<File | null> {
        const picked = await File.pickFileAsync({ mimeTypes: ['application/json', '*/*'] });
        return picked.canceled ? null : picked.result;
    }

    async function restore(file: File, secret?: string): Promise<BackupOutcome> {
        setBusy('restore');
        try {
            // Restaurar reemplaza todo: sin una copia verificada de lo que hay, no se empieza.
            try {
                await ensureSafetyBackup('restore');
            } catch {
                return { kind: 'error', code: 'safetyFailed' };
            }
            const report = await restoreBackup(await file.text(), deviceBackupFiles, secret);
            // `invalidateQueries` y no `clear()`: las pestañas siguen montadas bajo la
            // pantalla de copia y `clear()` no avisa a sus consultas, que se
            // quedarían con los datos de antes de restaurar.
            await client.invalidateQueries();
            if (!session || !(await findUser(session.userId))) {
                clear();
                router.replace('/(auth)/welcome');
            }
            return { kind: 'restored', missingFiles: report.missingFiles };
        } catch (error) {
            const code = error instanceof RestoreError ? error.code : 'generic';
            return { kind: 'error', code };
        } finally {
            setBusy(null);
        }
    }

    return { busy, exportBackup, pickBackup, restore };
}
