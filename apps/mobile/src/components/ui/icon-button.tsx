import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';
import { BUTTON_CONTAINERS, BUTTON_ICON_TONE, type ButtonVariant } from '@/lib/ui/button-variants';

type Size = 'sm' | 'md' | 'lg';

const BOX: Record<Size, number> = { sm: 32, md: 40, lg: 48 };
const GLYPH: Record<Size, number> = { sm: 16, md: 18, lg: 22 };
const MIN_TOUCH = 44;

/** El hueco que le falta a la caja visible para llegar a los 44 px de área
 * táctil (Regla 5 punto 4): crece el `hitSlop`, no el dibujo del icono. */
function touchPadding(box: number) {
  const extra = Math.max(0, Math.ceil((MIN_TOUCH - box) / 2));
  return { top: extra, bottom: extra, left: extra, right: extra };
}

interface IconButtonProps extends Omit<PressableProps, 'children' | 'hitSlop'> {
  icon: IoniconName;
  /** Sin texto al lado, la etiqueta accesible es obligatoria (Regla 2). */
  accessibilityLabel: string;
  variant?: ButtonVariant;
  size?: Size;
  className?: string;
}

/**
 * Botón solo icono — Fase 3. Comparte tono y color con `Button` (mismo mapa
 * de variantes) para que un botón de texto y uno de icono en la misma fila
 * se vean como la misma familia.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  disabled,
  className,
  ...props
}: IconButtonProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const iconColor = palette[BUTTON_ICON_TONE[variant]];
  const box = BOX[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={touchPadding(box)}
      style={{ width: box, height: box }}
      className={cn(
        'items-center justify-center rounded-lg active:opacity-80',
        BUTTON_CONTAINERS[variant],
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <Ionicons name={icon} size={GLYPH[size]} color={iconColor} />
    </Pressable>
  );
}
