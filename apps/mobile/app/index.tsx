import { Redirect } from 'expo-router';

import { BrandSplash } from '@/components/auth/brand-splash';
import { useSession } from '@/lib/auth-client';

/**
 * Punto de entrada: decide entre el área autenticada y el login. La sesión se
 * lee del almacén seguro, así que el primer render llega sin respuesta
 * todavía — y ese instante lleva la marca (`BrandSplash`), no un spinner
 * suelto sobre blanco.
 */
export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) return <BrandSplash />;

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
