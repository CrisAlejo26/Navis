import { Redirect, Stack } from 'expo-router';

import { useLocalSession } from '@/stores/local-session';

/**
 * Rutas públicas. Si ya hay sesión **completa** —cuenta e iglesia— no tiene
 * sentido volver a entrar. Con cuenta pero sin iglesia se deja pasar: falta
 * `church-setup`, que es el paso bloqueante del alta (RFC 0024, Fase 1).
 */
export default function AuthLayout() {
  const session = useLocalSession((state) => state.session);

  if (session?.churchId) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
