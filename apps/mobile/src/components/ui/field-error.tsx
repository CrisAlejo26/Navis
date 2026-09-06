import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';

/**
 * El error de un campo: icono además de color, nunca solo color (Regla 3
 * §7). Lo compartían `TextField`, `FieldButton` y `RadioGroup` — Fase 7.
 */
export function FieldError({ message }: { message: string }) {
  return (
    <View className="gap-1 flex-row items-center">
      <Icon name="alert-circle" tone="destructive" size="sm" />
      <Text className="text-sm font-sans text-destructive">{message}</Text>
    </View>
  );
}
