import { useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { useState } from 'react';

import { findUser } from '@/data/repos/account-repo';
import { deviceBackupFiles } from '@/lib/backup/backup-files';
import { buildBackup } from '@/lib/backup/create-backup';
import { restoreBackup, RestoreError } from '@/lib/backup/restore-backup';
import { useLocalSession } from '@/stores/local-session';

export type BackupOutcome =
    | { kind: 'restored' }
    | { kind: 'error'; code: 'invalid' | 'newer' | 'generic' | 'exportFailed' };

/**
 * Exportar y restaurar la copia de seguridad. Al restaurar, la caché de
 * consultas se invalida entera (todo lo que había cambió de golpe) y, si la sesión
 * abierta ya no existe en la copia, se vuelve a la bienvenida.
 */
export function useBackup() {
    const client = useQueryClient();
    const session = useLocalSession((state) => state.session);
    const clear = useLocalSession((state) => state.clear);
    const [busy, setBusy] = useState<'export' | 'restore' | null>(null);

    async function exportBackup(): Promise<BackupOutcome | null> {
        setBusy('export');
        try {
            const backup = await buildBackup(deviceBackupFiles);
            const name = `navis-copia-${backup.createdAt.slice(0, 10)}.json`;
            const file = new File(Paths.cache, name);
            file.create({ overwrite: true });
            file.write(JSON.stringify(backup));
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

    async function restore(file: File): Promise<BackupOutcome> {
        setBusy('restore');
        try {
            await restoreBackup(await file.text(), deviceBackupFiles);
            // `invalidateQueries` y no `clear()`: las pestañas siguen montadas bajo la
            // pantalla de copia y `clear()` no avisa a sus consultas, que se
            // quedarían con los datos de antes de restaurar.
            await client.invalidateQueries();
            if (!session || !(await findUser(session.userId))) {
                clear();
                router.replace('/(auth)/welcome');
            }
            return { kind: 'restored' };
        } catch (error) {
            const code = error instanceof RestoreError ? error.code : 'generic';
            return { kind: 'error', code };
        } finally {
            setBusy(null);
        }
    }

    return { busy, exportBackup, pickBackup, restore };
}
