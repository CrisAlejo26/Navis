import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/lib/auth-client';

/**
 * Punto de entrada: decide entre el área autenticada y el login. La sesión se
 * lee del almacén seguro, así que el primer render llega sin respuesta todavía.
 */
export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
