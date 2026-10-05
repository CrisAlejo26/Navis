/** Node AES-GCM implements the native Expo contract for repository tests. */
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
class Key {
    constructor(bytes) {
        this.value = Buffer.from(bytes);
    }
    static async generate() {
        return new Key(randomBytes(32));
    }
    static async import(bytes, encoding) {
        return new Key(typeof bytes === 'string' ? Buffer.from(bytes, encoding) : bytes);
    }
    async encoded(encoding) {
        return this.value.toString(encoding);
    }
}
class Sealed {
    constructor(bytes) {
        this.value = Buffer.from(bytes);
    }
    static fromCombined(value) {
        if (typeof value === 'string')
            throw new TypeError('Android SealedData requires byte input');
        return new Sealed(value);
    }
    async combined(encoding) {
        return encoding ? this.value.toString(encoding) : new Uint8Array(this.value);
    }
}
module.exports = {
    AESEncryptionKey: Key,
    AESSealedData: Sealed,
    aesEncryptAsync: async (plaintext, key) => {
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key.value, nonce);
        const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        return new Sealed(Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]));
    },
    aesDecryptAsync: async (sealed, key) => {
        const bytes = sealed.value;
        const decipher = createDecipheriv('aes-256-gcm', key.value, bytes.subarray(0, 12));
        decipher.setAuthTag(bytes.subarray(-16));
        return new Uint8Array(
            Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]),
        );
    },
};
