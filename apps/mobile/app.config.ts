import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de Expo en TypeScript (en vez de app.json) para poder leer
 * variables de entorno y reutilizar los colores del paquete de tema.
 *
 * Los `EXPO_PUBLIC_*` acaban en el bundle: son públicos por definición, así que
 * aquí solo va a qué servidor apunta la app, nunca un secreto.
 */
const scheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'pastortools';

/** Lo sincroniza `pnpm release`; no lo edites a mano. */
const version = '0.1.0';

/**
 * Android exige un entero que siempre crezca: si baja, el sistema rechaza la
 * actualización. Se deriva de la versión para no llevar la cuenta aparte
 * (1.4.2 → 10402), igual que hace `scripts/release.mjs`.
 */
const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const config: ExpoConfig = {
  name: 'PastorTools',
  slug: 'pastortools',
  version,
  orientation: 'portrait',
  scheme,
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  // El splash ya no se configura aquí en SDK 57: solo con el plugin de abajo.
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'org.pastortools.app',
  },
  android: {
    package: 'org.pastortools.app',
    versionCode,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3b5bdb',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#fcfcfa',
        dark: { backgroundColor: '#0d0f15' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
