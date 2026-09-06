import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import type { IoniconName } from '@/lib/nav-mobile';

/** El hueco de una tarjeta del panel sin datos todavía: icono y un texto que
 * dice qué falta, no un espacio en blanco (Regla 9 §6). Lo usan tres tarjetas
 * de inicio (eventos, notas, tareas), así que se extrae (Regla 1 §5). */
export function EmptyRow({
  icon,
  label,
  palette,
}: {
  icon: IoniconName;
  label: string;
  palette: ThemeColors;
}) {
  return (
    <View className="gap-2 py-6 items-center">
      <Ionicons name={icon} size={22} color={palette.mutedForeground} />
      <Text className="text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}
