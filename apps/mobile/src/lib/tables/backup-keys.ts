import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import {
    AESEncryptionKey,
    AESSealedData,
    aesEncryptAsync,
    aesDecryptAsync,
    getRandomBytes,
} from 'expo-crypto';
import { z } from 'zod';
import { cellEnvelope, exportCellKeys, importCellKeys } from './crypto';
import { rowDataSchema } from '@navis/shared';
import type { BackupRow } from '@/lib/backup/backup-format';
import { sealedBytes } from './encoding';
import * as SecureStore from 'expo-secure-store';

const keyMap = z.record(z.uuid(), z.string().regex(/^[a-f0-9]{64}$/));
const portableSecrets = z.object({
    cells: keyMap,
    accountPepper: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
});

export const backupKeysSchema = z.object({
    version: z.literal(1),
    salt: z.string().regex(/^[a-f0-9]{32}$/),
    sealed: z.string(),
});
async function recoveryKey(secret: string, salt: string): Promise<AESEncryptionKey> {
    if (secret.length < 12) throw new Error('recovery-secret-required');
    return AESEncryptionKey.import(
        await pbkdf2Async(sha256, secret, hexToBytes(salt), { c: 600_000, dkLen: 32 }),
    );
}
export async function wrapBackupKeys(
    rows: BackupRow[],
    secret?: string,
): Promise<z.infer<typeof backupKeysSchema> | undefined> {
    const ids: string[] = [];
    for (const row of rows) {
        const data = rowDataSchema.parse(JSON.parse(String(row.data)) as unknown);
        for (const value of Object.values(data)) {
            const envelope = cellEnvelope.safeParse(value);
            if (envelope.success) ids.push(envelope.data.keyId);
        }
    }
    if (!ids.length && !secret) return undefined;
    const salt = bytesToHex(getRandomBytes(16));
    const sealed = await aesEncryptAsync(
        new TextEncoder().encode(
            JSON.stringify({
                cells: await exportCellKeys(ids),
                accountPepper: (await SecureStore.getItemAsync('navis.local.pepper')) ?? undefined,
            }),
        ),
        await recoveryKey(secret ?? '', salt),
    );
    return { version: 1, salt, sealed: await sealed.combined('base64') };
}
export async function unwrapBackupKeys(
    envelope: z.infer<typeof backupKeysSchema> | undefined,
    secret?: string,
): Promise<string | undefined> {
    if (!envelope) return;
    const bytes = await aesDecryptAsync(
        AESSealedData.fromCombined(sealedBytes(envelope.sealed)),
        await recoveryKey(secret ?? '', envelope.salt),
    );
    const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const payload = portableSecrets.safeParse(raw);
    await importCellKeys(payload.success ? payload.data.cells : keyMap.parse(raw));
    return payload.success ? payload.data.accountPepper : undefined;
}
