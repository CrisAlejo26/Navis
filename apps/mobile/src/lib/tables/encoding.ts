/** Expo's Android SealedData bridge requires bytes even though the JS API accepts base64. */
export function sealedBytes(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}
