import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarTone = 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';

const BOX: Record<AvatarSize, number> = { sm: 28, md: 34, lg: 40 };
const GLYPH: Record<AvatarSize, number> = { sm: 10, md: 12, lg: 14 };

const TONE_KEY: Record<AvatarTone, keyof ThemeColors> = {
  primary: 'primary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  muted: 'mutedForeground',
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  /**
   * El avatar va siempre junto al nombre en texto (una fila de listado, la
   * cabecera de un chat): sin etiqueta se oculta del lector de pantalla para
   * no leerse dos veces, como los iconos (Regla 2).
   */
  accessibilityLabel?: string;
  className?: string;
}

/** Las dos primeras iniciales del nombre: «Ana García» → «AG». */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? '';
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/**
 * El avatar de iniciales de un listado de personas (Fase 13 §18.2): círculo
 * con tinte suave del tono, letras del color completo — el mismo lenguaje de
 * `Icon` y `Badge` (Poppy y komoot traen el patrón). Sin imágenes: ningún
 * flujo de móvil maneja fotos de personas todavía (Regla 1 punto 4); las
 * traerá la implementación real de creyentes/tareas.
 */
export function Avatar({
  name,
  size = 'md',
  tone = 'primary',
  accessibilityLabel,
  className,
}: AvatarProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const toneHex = palette[TONE_KEY[tone]];

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      className={cn('items-center justify-center rounded-full', className)}
      style={{
        width: BOX[size],
        height: BOX[size],
        backgroundColor: hexAlpha(toneHex, 0.14),
      }}
    >
      <Text
        className="font-sans-semibold"
        style={{ fontSize: GLYPH[size], color: toneHex, lineHeight: undefined }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
