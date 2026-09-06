import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';
import {
  BUTTON_CONTAINERS,
  BUTTON_ICON_TONE,
  BUTTON_LABELS,
  BUTTON_SIZES,
  type ButtonSize,
  type ButtonVariant,
} from '@/lib/ui/button-variants';

const ICON_SIZE: Record<ButtonSize, number> = { sm: 15, md: 16, lg: 18 };

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /**
   * El icono acompaña al texto y no lo sustituye: se oculta del lector de
   * pantalla (Regla 2), porque `title` ya dice lo mismo. Para un botón que es
   * solo icono está `IconButton`, no este prop a solas.
   */
  leadingIcon?: IoniconName;
  trailingIcon?: IoniconName;
  className?: string;
}

/** Equivalente móvil del `Button` de la web: mismas variantes y mismos tokens. */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const iconColor = palette[BUTTON_ICON_TONE[variant]];

  const icon = (name: IoniconName | undefined) =>
    name ? (
      <Ionicons
        name={name}
        size={ICON_SIZE[size]}
        color={iconColor}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'gap-2 flex-row items-center justify-center rounded-lg active:opacity-80',
        BUTTON_CONTAINERS[variant],
        BUTTON_SIZES[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={iconColor} /> : icon(leadingIcon)}
      <Text className={cn('text-base font-sans-semibold', BUTTON_LABELS[variant])}>{title}</Text>
      {!loading ? icon(trailingIcon) : null}
    </Pressable>
  );
}
