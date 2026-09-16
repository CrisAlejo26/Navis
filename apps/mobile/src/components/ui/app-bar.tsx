import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { IconButton } from '@/components/ui/icon-button';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

interface AppBarAction {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}

interface AppBarProps {
  title: string;
  /** Lo que hay detrás: si falta, la flecha vuelve con `router.back()`. */
  backLabel?: string;
  actions?: AppBarAction[];
  /**
   * Sobre una escena de fondo (la cabecera de la ficha): fondo transparente
   * y glifos claros — los del tema se pierden contra el degradado.
   */
  onScene?: boolean;
}

const ACTION_HIT = 44;

/**
 * La barra superior de las pantallas que se empujan en la pila (ficha de un
 * hermano, catálogo): flecha de vuelta a la izquierda, título centrado y
 * acciones a la derecha — el patrón de LEGO Builder (flecha sola, sin texto,
 * objetivo de 44 px) y de Mozi (título centrado, aire alrededor), con los
 * tokens de Navis.
 *
 * Sustituye al `Stack.Screen` nativo en las pantallas que la usan: el fondo
 * es el de la pantalla (`bg-background`), la flecha vuelve de verdad y las
 * acciones son `IconButton` de 44 px. Va pegada arriba con su safe area.
 */
export function AppBar({ title, backLabel, actions = [], onScene = false }: AppBarProps) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const claro = palette.primaryForeground;
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`gap-1 px-1.5 pb-2 ${onScene ? '' : 'bg-background'}`}
      style={{ paddingTop: insets.top + 4 }}
      accessibilityRole="header"
    >
      <View className="h-11 flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel ?? t('common.back')}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
        >
          <Ionicons name="chevron-back" size={24} color={onScene ? claro : palette.foreground} />
        </Pressable>

        <Text
          className="text-base font-sans-semibold flex-1 text-center text-foreground"
          numberOfLines={1}
        >
          {title}
        </Text>

        <View className="gap-1 flex-row items-center" style={{ minWidth: ACTION_HIT }}>
          {actions.map((action) => (
            <IconButton
              key={action.label}
              icon={action.icon}
              accessibilityLabel={action.label}
              onPress={action.onPress}
              iconColor={onScene ? claro : undefined}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
