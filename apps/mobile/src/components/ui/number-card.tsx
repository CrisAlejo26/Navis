import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';

interface NumberCardProps {
  /** El número ya formateado: la tarjeta no sabe de formato. */
  value: string;
  label: string;
  icon?: IoniconName;
  className?: string;
}

/**
 * Tarjeta de número donde el número es el protagonista — el patrón GO Club /
 * Checker que enseña Refero (cifra muy grande, etiqueta debajo). Para un
 * contador de racha o un dato único del panel de inicio.
 */
export function NumberCard({ value, label, icon, className }: NumberCardProps) {
  return (
    <View
      className={cn('gap-1 p-4 items-center rounded-xl border border-border bg-card', className)}
    >
      {icon ? <Icon name={icon} size="md" tone="primary" /> : null}
      <Text className="text-4xl font-sans-semibold text-foreground tabular-nums">{value}</Text>
      <Text className="text-sm font-sans text-muted-foreground">{label}</Text>
    </View>
  );
}
