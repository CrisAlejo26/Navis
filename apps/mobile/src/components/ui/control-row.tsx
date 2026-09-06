import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface ControlRowProps {
  label: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityRole: 'checkbox' | 'radio' | 'switch';
  checked?: boolean;
  selected?: boolean;
  control: ReactNode;
  controlPosition?: 'leading' | 'trailing';
}

/**
 * La fila que comparten `Checkbox`, `RadioGroup` y `Switch` (Fase 6): la
 * etiqueta, la descripción opcional y el control se repetían en los tres, así
 * que sale a su propio fichero en cuanto apareció la tercera vez (Regla 1
 * §5). Toda la fila es el objetivo táctil, no solo el dibujo del control
 * (Regla 5 punto 4) — por eso el control que se pasa siempre va decorativo.
 */
export function ControlRow({
  label,
  description,
  onPress,
  disabled = false,
  accessibilityRole,
  checked,
  selected,
  control,
  controlPosition = 'leading',
}: ControlRowProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ disabled, checked, selected }}
      disabled={disabled}
      onPress={onPress}
      className={cn('min-h-11 gap-3 py-2 flex-row items-center', disabled && 'opacity-50')}
    >
      {controlPosition === 'leading' ? control : null}
      <View className="gap-0.5 flex-1">
        <Text className="text-base font-sans text-foreground">{label}</Text>
        {description ? (
          <Text className="text-sm font-sans text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {controlPosition === 'trailing' ? control : null}
    </Pressable>
  );
}
