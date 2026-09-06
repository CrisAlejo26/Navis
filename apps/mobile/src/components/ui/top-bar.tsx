import { View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { BodyText } from '@/components/ui/text';
import { Title } from '@/components/ui/title';
import type { IoniconName } from '@/lib/nav-mobile';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: {
    icon: IoniconName;
    label: string;
    onPress: () => void;
  };
}

/**
 * Cabecera de pantalla — Fase 8, para las que hoy pintan su título a mano
 * (`MoreScreen`, `PlaceholderScreen`). No lleva variante «con botón atrás»:
 * las pantallas que se empujan en la pila ya tienen la suya, nativa, puesta
 * por `Stack.Screen` en `app/_layout.tsx` (RFC 0001) — una propia aquí la
 * duplicaría en vez de sustituirla, porque esa cabecera no se apaga por
 * pantalla, sino para todo el grupo `(tabs)`.
 */
export function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <View className="gap-3 flex-row items-start justify-between">
      <View className="gap-0.5 flex-1">
        <Title size="lg">{title}</Title>
        {subtitle ? <BodyText className="text-muted-foreground">{subtitle}</BodyText> : null}
      </View>
      {action ? (
        <IconButton icon={action.icon} accessibilityLabel={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}
