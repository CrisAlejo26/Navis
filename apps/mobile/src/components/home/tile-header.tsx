import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';

export type TileTone = 'filled' | 'primary' | 'success' | 'warning' | 'accent';

/**
 * La cabecera compartida de una cara del panel de inicio: icono en pastilla
 * teñida y etiqueta. Espejo de `TileHeader` de la web (RFC 0001), mismos
 * acentos (`stat-tones.ts`). El tono `filled` es un caso aparte: la tarjeta
 * ya tiene fondo de color, así que el icono se invierte (blanco sobre un tinte
 * de su propio blanco) en vez de usar un tono semántico — por eso no pasa por
 * `Icon` (Fase 2), que resuelve tono a partir del tema, no del contenedor.
 */
export function TileHeader({
  icon,
  label,
  tone,
  palette,
}: {
  icon: IoniconName;
  label: string;
  tone: TileTone;
  palette: ThemeColors;
}) {
  const filled = tone === 'filled';

  return (
    <View className="gap-2 flex-row items-center">
      {tone === 'filled' ? (
        <View
          className="h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: hexAlpha(palette.primaryForeground, 0.15) }}
        >
          <Ionicons name={icon} size={15} color={palette.primaryForeground} />
        </View>
      ) : (
        <Icon name={icon} tone={tone} background="soft" shape="square" size="sm" />
      )}
      <Text
        className="text-sm font-medium"
        style={{
          color: filled ? hexAlpha(palette.primaryForeground, 0.85) : palette.mutedForeground,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
