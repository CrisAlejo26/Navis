import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de Expo en TypeScript (en vez de app.json) para poder leer
 * variables de entorno y reutilizar los colores del paquete de tema.
 *
 * Los `EXPO_PUBLIC_*` acaban en el bundle: son públicos por definición, así que
 * aquí solo va a qué servidor apunta la app, nunca un secreto.
 */
const scheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'navis';

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
    name: 'Navis',
    slug: 'navis',
    version,
    orientation: 'portrait',
    scheme,
    userInterfaceStyle: 'automatic',
    icon: './assets/icon.png',
    // El splash ya no se configura aquí en SDK 57: solo con el plugin de abajo.
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'org.navis.app',
    },
    android: {
        package: 'org.navis.app',
        versionCode,
        adaptiveIcon: {
            // El primer plano es el barco en blanco con transparencia; el color de
            // marca lo pone esta capa, que es lo que exige el formato adaptativo.
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#2140cf',
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
        // La sincronización pendiente se retoma sola cuando el sistema lo permite.
        'expo-background-task',
        // El micrófono pide permiso y declaración en el manifest: lo lleva su
        // plugin de config, no un ajuste a mano.
        'expo-audio',
        [
            'expo-image-picker',
            {
                photosPermission: 'Navis usa tus fotos para la ficha de cada hermano.',
                cameraPermission: 'Navis usa la cámara para la foto de cada hermano.',
                microphonePermission: false,
            },
        ],
        [
            // Los avisos de recordatorio son **locales** (sin servidor de push).
            // El plugin declara el permiso POST_NOTIFICATIONS en el manifest y
            // fija el icono pequeño de la barra —el barco en blanco sobre
            // transparente que genera `pnpm icons`— y el azul de marca.
            'expo-notifications',
            {
                icon: './assets/notification-icon.png',
                color: '#2140cf',
                defaultChannel: 'note-reminders-v1',
            },
        ],
        [
            'expo-splash-screen',
            {
                image: './assets/splash-icon.png',
                // El mismo lado que `SPLASH_BOAT_SIZE`: el splash animado de JS
                // relevará a este sin que el barco cambie de tamaño.
                imageWidth: 200,
                resizeMode: 'contain',
                // El azul de la marca a pantalla completa, en claro y en oscuro: la
                // marca no cambia con el tema (Reglas 3 y 7).
                backgroundColor: '#2140cf',
                dark: { backgroundColor: '#2140cf' },
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
};

export default config;
