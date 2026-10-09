import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import {
    AESEncryptionKey,
    AESSealedData,
    aesDecryptAsync,
    aesEncryptAsync,
    getRandomBytes,
} from 'expo-crypto';
import { z } from 'zod';

import { sealedBytes } from '../tables/encoding';

export const ENCRYPTED_FORMAT = 'navis-backup-encrypted';
const ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 12;

/**
 * El paquete entero cifrado con una contraseña: AES-256-GCM (cifrado
 * autenticado, así que una contraseña equivocada y un fichero alterado fallan
 * igual) con una clave derivada por PBKDF2. Sin esto, el JSON de una copia —con
 * todas las personas y sus notas— viajaba en claro por correo o por la nube.
 */
export const encryptedPackageSchema = z.object({
    format: z.literal(ENCRYPTED_FORMAT),
    version: z.literal(1),
    kdf: z.literal('pbkdf2-sha256'),
    iterations: z.number().int().min(100_000),
    salt: z.string().regex(/^[a-f0-9]{32}$/),
    sealed: z.string(),
});

export type EncryptedPackage = z.infer<typeof encryptedPackageSchema>;

/** La contraseña no es válida (corta) o no abre el paquete (equivocada, o el fichero está alterado). */
export class PackagePasswordError extends Error {}

function deriveKey(password: string, salt: string, iterations: number): Promise<AESEncryptionKey> {
    return pbkdf2Async(sha256, password, hexToBytes(salt), { c: iterations, dkLen: 32 }).then(
        (bytes) => AESEncryptionKey.import(bytes),
    );
}

export async function sealPackage(plain: string, password: string): Promise<EncryptedPackage> {
    if (password.length < MIN_PASSWORD_LENGTH) throw new PackagePasswordError('too-short');
    const salt = bytesToHex(getRandomBytes(16));
    const sealed = await aesEncryptAsync(
        new TextEncoder().encode(plain),
        await deriveKey(password, salt, ITERATIONS),
    );
    return {
        format: ENCRYPTED_FORMAT,
        version: 1,
        kdf: 'pbkdf2-sha256',
        iterations: ITERATIONS,
        salt,
        sealed: await sealed.combined('base64'),
    };
}

export async function openPackage(envelope: EncryptedPackage, password: string): Promise<string> {
    try {
        const bytes = await aesDecryptAsync(
            AESSealedData.fromCombined(sealedBytes(envelope.sealed)),
            await deriveKey(password, envelope.salt, envelope.iterations),
        );
        return new TextDecoder().decode(bytes);
    } catch {
        throw new PackagePasswordError('wrong-or-tampered');
    }
}

/** Si el texto es un paquete cifrado de Navis; `null` si no lo es (una copia en claro, o ni eso). */
export function parseEncryptedPackage(text: string): EncryptedPackage | null {
    try {
        const parsed = encryptedPackageSchema.safeParse(JSON.parse(text));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
