import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';

export type TileTone = 'filled' | 'primary' | 'success' | 'warning' | 'accent';

/**
 * La cabecera compartida de una cara del panel de inicio: icono en pastilla
 * teñida y etiqueta. Espejo de `TileHeader` de la web (RFC 0001): mismos
 * acentos (`stat-tones.ts`), pero el tinte se calcula a mano porque React
 * Native no resuelve `bg-primary/12` como Tailwind en web (Regla 3 §5).
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
  const toneHex = tone === 'filled' ? palette.primaryForeground : palette[tone];
  const filled = tone === 'filled';

  return (
    <View className="gap-2 flex-row items-center">
      <View
        className="h-7 w-7 items-center justify-center rounded-lg"
        style={{ backgroundColor: hexAlpha(toneHex, filled ? 0.15 : 0.14) }}
      >
        <Ionicons name={icon} size={15} color={toneHex} />
      </View>
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
