import {
    AESEncryptionKey,
    AESSealedData,
    aesEncryptAsync,
    aesDecryptAsync,
    randomUUID,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { sealedBytes } from './encoding';

export const cellEnvelope = z.object({
    navisCipher: z.literal(1),
    keyId: z.string().uuid(),
    sealed: z.string(),
});
const prefix = 'navis.table-key.';
let active: Promise<{ id: string; key: AESEncryptionKey }> | undefined;

async function currentKey(): Promise<{ id: string; key: AESEncryptionKey }> {
    if (!active)
        active = (async () => {
            const existing = await SecureStore.getItemAsync(`${prefix}active`);
            if (existing) {
                const encoded = await SecureStore.getItemAsync(prefix + existing);
                if (!encoded) throw new Error('missing-key');
                return { id: existing, key: await AESEncryptionKey.import(encoded, 'hex') };
            }
            const id = randomUUID(),
                key = await AESEncryptionKey.generate();
            await SecureStore.setItemAsync(prefix + id, await key.encoded('hex'));
            await SecureStore.setItemAsync(`${prefix}active`, id);
            return { id, key };
        })().catch((error: unknown) => {
            active = undefined;
            throw error;
        });
    return active;
}
export async function encryptCell(value: string): Promise<z.infer<typeof cellEnvelope>> {
    const { id, key } = await currentKey();
    const sealed = await aesEncryptAsync(new TextEncoder().encode(value), key);
    return { navisCipher: 1, keyId: id, sealed: await sealed.combined('base64') };
}
export async function decryptCell(value: unknown): Promise<string> {
    const envelope = cellEnvelope.parse(value);
    const encoded = await SecureStore.getItemAsync(prefix + envelope.keyId);
    if (!encoded) throw new Error('missing-key');
    const key = await AESEncryptionKey.import(encoded, 'hex');
    return new TextDecoder().decode(
        await aesDecryptAsync(AESSealedData.fromCombined(sealedBytes(envelope.sealed)), key),
    );
}
export async function exportCellKeys(ids: string[]): Promise<Record<string, string>> {
    const keys: Record<string, string> = {};
    for (const id of new Set(ids)) {
        const encoded = await SecureStore.getItemAsync(prefix + id);
        if (!encoded) throw new Error('missing-key');
        keys[id] = encoded;
    }
    return keys;
}
export async function importCellKeys(keys: Record<string, string>): Promise<void> {
    for (const [id, encoded] of Object.entries(keys)) {
        z.uuid().parse(id);
        await AESEncryptionKey.import(encoded, 'hex');
        const existing = await SecureStore.getItemAsync(prefix + id);
        if (existing && existing !== encoded) throw new Error('key-conflict');
        await SecureStore.setItemAsync(prefix + id, encoded);
    }
}
