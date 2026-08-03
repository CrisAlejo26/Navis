import AsyncStorage from '@react-native-async-storage/async-storage';
import { createI18n, type Locale } from '@fidus/i18n';
import { getLocales } from 'expo-localization';

const STORAGE_KEY = 'fidus.locale';

/**
 * `getLocales()` devuelve los idiomas del dispositivo por orden de
 * preferencia; el primero es el que el usuario tiene configurado.
 */
const deviceLocale = getLocales()[0]?.languageCode ?? undefined;

/**
 * i18next se inicializa de forma síncrona con el idioma del dispositivo para
 * que el primer render ya salga traducido. La preferencia guardada (si la hay)
 * se aplica después, porque AsyncStorage es asíncrono.
 */
// En Jest `__DEV__` también es true, y i18next vuelca su configuración entera
// en cada suite: se apaga ahí para que la salida de los tests sea legible.
export const i18n = createI18n({
  deviceLocale,
  debug: __DEV__ && process.env.NODE_ENV !== 'test',
});

void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
  if (stored && stored !== i18n.language) void i18n.changeLanguage(stored);
});

export async function setLocale(locale: Locale): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, locale);
  await i18n.changeLanguage(locale);
}

export function getLocale(): string {
  return i18n.resolvedLanguage ?? i18n.language;
}
