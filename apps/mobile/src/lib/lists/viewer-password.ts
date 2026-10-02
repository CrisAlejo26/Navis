import { scryptAsync } from '@noble/hashes/scrypt.js';
import { getRandomBytes } from 'expo-crypto';
import { LIST_PASSWORD_ALPHABET, normalizeListPassword } from '@navis/shared';

export function newViewerPassword(): string {
    let password = '';
    const limit = 256 - (256 % LIST_PASSWORD_ALPHABET.length);
    while (password.length < 12) {
        for (const byte of getRandomBytes(16)) {
            if (byte < limit && password.length < 12)
                password += LIST_PASSWORD_ALPHABET[byte % LIST_PASSWORD_ALPHABET.length];
        }
    }
    return password.match(/.{4}/g)!.join('-');
}

/** Mismo algoritmo, parámetros y formato que ListPasswordService en la API. */
export async function hashViewerPassword(password: string): Promise<string> {
    const salt = getRandomBytes(16);
    const key = await scryptAsync(new TextEncoder().encode(normalizeListPassword(password)), salt, {
        N: 16384,
        r: 8,
        p: 1,
        dkLen: 32,
        asyncTick: 10,
    });
    const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
    return `scrypt$16384$8$1$${base64(salt)}$${base64(key)}`;
}
