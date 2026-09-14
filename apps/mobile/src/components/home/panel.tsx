import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

/**
 * La sombra compartida de las tarjetas del panel (rediseño RFC 0001): la
 * referencia separa los paneles por contraste y redondeo, no por borde, así
 * que el `border` de las tarjetas antiguas se queda fuera. `elevation` en
 * Android da su sombra griseada sin el valor web.
 */
export const PANEL_SHADOW: ViewStyle = {
  shadowColor: '#081231',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

/** La tarjeta del panel: redondeo grueso, sin borde, sombra suave. */
export function Panel({ children, className, style }: PanelProps) {
  return (
    <View className={cn('gap-3 p-4 rounded-3xl bg-card', className)} style={[PANEL_SHADOW, style]}>
      {children}
    </View>
  );
}
