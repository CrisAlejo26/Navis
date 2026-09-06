import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

type Size = 'sm' | 'md' | 'lg';
type Tone = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
type Background = 'none' | 'soft';
type Shape = 'circle' | 'square';

const GLYPH_SIZE: Record<Size, number> = { sm: 16, md: 20, lg: 24 };
const CONTAINER_SIZE: Record<Size, number> = { sm: 28, md: 34, lg: 40 };

interface IconProps {
  name: IoniconName;
  size?: Size;
  tone?: Tone;
  background?: Background;
  shape?: Shape;
  className?: string;
  /**
   * Solo hace falta cuando el icono va solo, sin texto al lado (Regla 2):
   * con etiqueta se anuncia; sin ella, se oculta del lector de pantalla en
   * vez de leerse dos veces junto al texto que ya lo acompaña.
   */
  accessibilityLabel?: string;
}

/**
 * El icono envuelto: tamaño, tono y contenedor opcional — Fase 2 de
 * `docs/sistema-componentes-movil-plan.md`. Los iconos de
 * `@expo/vector-icons` no admiten `className` en su prop `color` (Regla 3
 * §5), así que el tono se resuelve aquí una sola vez a partir del tema, en
 * vez de que cada pantalla repita su propio `hexAlpha` (como hacía
 * `TileHeader`, que ahora reutiliza este componente).
 */
export function Icon({
  name,
  size = 'md',
  tone = 'default',
  background = 'none',
  shape = 'circle',
  className,
  accessibilityLabel,
}: IconProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const toneHex = tone === 'default' ? palette.mutedForeground : palette[tone];

  const glyph = (
    <Ionicons
      name={name}
      size={GLYPH_SIZE[size]}
      color={toneHex}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );

  if (background === 'none') {
    return glyph;
  }

  const box = CONTAINER_SIZE[size];

  return (
    <View
      className={cn(
        'items-center justify-center',
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        className,
      )}
      style={{ width: box, height: box, backgroundColor: hexAlpha(toneHex, 0.14) }}
    >
      {glyph}
    </View>
  );
}
