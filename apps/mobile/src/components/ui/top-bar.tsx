import { View } from 'react-native';
import { themeColorsHex } from '@navis/theme';

import { IconButton } from '@/components/ui/icon-button';
import { BodyText } from '@/components/ui/text';
import { Title } from '@/components/ui/title';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';
import { cn } from '@/lib/cn';

interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Clases extra para el subtítulo: una pantalla puede querer más pequeño. */
  subtitleClassName?: string;
  /** Líneas máximas del subtítulo (una sola línea, truncado, por ejemplo). */
  subtitleLines?: number;
  action?: {
    icon: IoniconName;
    label: string;
    onPress: () => void;
  };
  /** Varias acciones a la derecha, en orden: la última es la principal. */
  actions?: {
    icon: IoniconName;
    label: string;
    onPress: () => void;
  }[];
  /**
   * Sobre una escena de fondo (el mar de la cabecera de creyentes): título y
   * subtítulo en blanco y las acciones con su icono también claro, porque el
   * `mutedForeground` del tema se pierde contra el azul de la ilustración.
   */
  onScene?: boolean;
}

/**
 * Cabecera de pantalla — Fase 8, para las que hoy pintan su título a mano
 * (`MoreScreen`, `PlaceholderScreen`). No lleva variante «con botón atrás»:
 * las pantallas que se empujan en la pila ya tienen la suya, nativa, puesta
 * por `Stack.Screen` en `app/_layout.tsx` (RFC 0001) — una propia aquí la
 * duplicaría en vez de sustituirla, porque esa cabecera no se apaga por
 * pantalla, sino para todo el grupo `(tabs)`.
 */
export function TopBar({
  title,
  subtitle,
  subtitleClassName,
  subtitleLines,
  action,
  actions,
  onScene = false,
}: TopBarProps) {
  const claro = themeColorsHex[useThemeStore((state) => state.resolvedTheme)].primaryForeground;
  const all = [...(actions ?? []), ...(action ? [action] : [])];
  return (
    <View className="gap-3 flex-row items-start justify-between">
      <View className="gap-0.5 flex-1">
        <Title size="lg" className={onScene ? 'text-white' : undefined}>
          {title}
        </Title>
        {subtitle ? (
          <BodyText
            numberOfLines={subtitleLines}
            className={cn(onScene ? 'text-white/75' : 'text-muted-foreground', subtitleClassName)}
          >
            {subtitle}
          </BodyText>
        ) : null}
      </View>
      {all.length > 0 ? (
        <View className="gap-2 flex-row items-center">
          {all.map((one) => (
            <IconButton
              key={one.label}
              icon={one.icon}
              accessibilityLabel={one.label}
              onPress={one.onPress}
              iconColor={onScene ? claro : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
