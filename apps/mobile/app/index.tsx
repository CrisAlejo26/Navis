import { Redirect } from 'expo-router';

import { BrandSplash } from '@/components/auth/brand-splash';
import { useLocalSession } from '@/stores/local-session';

/**
 * Punto de entrada: decide entre el área autenticada y la bienvenida. La
 * sesión es **local** (RFC 0024): vive en AsyncStorage, que se rehidrata de
 * forma asíncrona — ese instante lleva la marca (`BrandSplash`), no un
 * spinner suelto sobre blanco.
 */
export default function Index() {
    const session = useLocalSession((state) => state.session);
    const hydrated = useLocalSession((state) => state.hydrated);

    if (!hydrated) return <BrandSplash />;

    return <Redirect href={session ? '/(tabs)' : '/(auth)/welcome'} />;
}
