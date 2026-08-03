import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/auth-client';

/** Rutas públicas. Si ya hay sesión, no tiene sentido volver a entrar. */
export default function AuthLayout() {
  const { data: session, isPending } = useSession();

  if (!isPending && session) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
