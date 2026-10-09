import * as SecureStore from 'expo-secure-store';

const CREDENTIAL_KEY = 'navis.sync.credential';

/**
 * La credencial del dispositivo vive solo en SecureStore: no entra en las
 * copias de seguridad ni en AsyncStorage, y se borra al desvincular.
 */
export const readCredential = (): Promise<string | null> =>
    SecureStore.getItemAsync(CREDENTIAL_KEY);

export const saveCredential = (value: string): Promise<void> =>
    SecureStore.setItemAsync(CREDENTIAL_KEY, value);

export const deleteCredential = (): Promise<void> => SecureStore.deleteItemAsync(CREDENTIAL_KEY);
