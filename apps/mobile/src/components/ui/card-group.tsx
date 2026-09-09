import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

interface CardGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * La tarjeta agrupada de un listado (Fase 9 de
 * `docs/sistema-componentes-movil-plan.md`): un contenedor redondeado con
 * borde que parte en filas con separadores finos — el patrón de LEGO Builder y
 * Comet que enseña Refero. Las filas suelen ser `ListRow`; aquí va el borde y
 * el divisor, así cada fila no repite el suyo.
 */
export function CardGroup({ children, className }: CardGroupProps) {
  const items = Children.toArray(children);

  return (
    <View className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      {items.map((child, i) => (
        <View key={i} className={i > 0 ? 'border-t border-border' : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}
