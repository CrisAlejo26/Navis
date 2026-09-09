import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

interface ListRowProps {
  /** Icono o miniatura al inicio (típicamente `Icon`). Opcional. */
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Valor, `Badge` o control al final. Opcional. */
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Sin él, se anuncia el título (Regla 2). */
  accessibilityLabel?: string;
}

const ROW = 'min-h-11 gap-3 px-3 py-2 flex-row items-center';

/**
 * La fila-tarjeta de un listado (Fase 9 de
 * `docs/sistema-componentes-movil-plan.md`): icono/avatar + título + subtítulo
 * + `trailing` (valor o `Badge`) + chevron cuando se puede pulsar. El patrón
 * de tarjeta agrupada con separadores finos lo aporta `CardGroup`, que la
 * envuelve; la fila sola no repite bordes. Alto mínimo de 44 px en toda la
 * fila, no solo en el control (Regla 5 punto 4).
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View className="gap-0.5 flex-1">
        <Text className="text-base font-sans text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-sm font-sans text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevron-forward" size="sm" /> : null}
    </>
  );

  if (!onPress) {
    return <View className={cn(ROW)}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(ROW, 'rounded-lg active:opacity-80', disabled && 'opacity-50')}
    >
      {content}
    </Pressable>
  );
}
