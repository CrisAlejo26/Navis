import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

type ChangeDirection = 'up' | 'down' | 'flat';
type ChangeTone = 'success' | 'destructive' | 'default';

const ARROW: Record<ChangeDirection, IoniconName> = {
  up: 'arrow-up',
  down: 'arrow-down',
  flat: 'remove',
};

const TONE: Record<ChangeDirection, ChangeTone> = {
  up: 'success',
  down: 'destructive',
  flat: 'default',
};

const TEXT_KEY: Record<ChangeTone, keyof ThemeColors> = {
  success: 'success',
  destructive: 'destructive',
  default: 'mutedForeground',
};

interface StatCardProps {
  label: string;
  /** El valor ya formateado (número, unidad…): la tarjeta no sabe de formato. */
  value: string;
  icon?: IoniconName;
  /** Indicador de cambio: dirección + texto. Nunca solo color (Regla 3 §7). */
  change?: { direction: ChangeDirection; text: string };
  className?: string;
}

/**
 * Tarjeta de estadística compacta (Fase 10 de
 * `docs/sistema-componentes-movil-plan.md`): número grande + etiqueta + icono
 * opcional + indicador de cambio con flecha, texto y color — el patrón de
 * Dock/Copilot que enseña Refero (número grande, etiqueta pequeña, variación
 * debajo).
 */
export function StatCard({ label, value, icon, change, className }: StatCardProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

  return (
    <View className={cn('gap-2 p-4 rounded-xl border border-border bg-card', className)}>
      <View className="gap-2 flex-row items-center">
        {icon ? <Icon name={icon} size="sm" background="soft" /> : null}
        <Text className="text-sm font-sans text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
      </View>

      <Text className="text-3xl font-sans-semibold text-foreground tabular-nums">{value}</Text>

      {change ? (
        <View className="gap-1 flex-row items-center">
          <Icon name={ARROW[change.direction]} size="sm" tone={TONE[change.direction]} />
          <Text
            className="text-xs font-sans-medium"
            style={{ color: palette[TEXT_KEY[TONE[change.direction]]] }}
          >
            {change.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
