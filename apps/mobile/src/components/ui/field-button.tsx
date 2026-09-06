import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';

interface FieldButtonProps {
  label: string;
  value?: string;
  placeholder: string;
  icon: IoniconName;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

/**
 * Un campo que no se escribe, se abre — Fase 5. Mismo lenguaje visual que
 * `TextField` (borde, alto, radio) para que un formulario mezclando campos de
 * texto y selectores se vea de la misma familia; `Select`, `DatePicker` y
 * `DateRangePicker` lo usan como disparador.
 */
export function FieldButton({
  label,
  value,
  placeholder,
  icon,
  onPress,
  disabled = false,
}: FieldButtonProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-sans-medium text-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        className={cn(
          'h-11 px-3 flex-row items-center justify-between rounded-lg border-2 border-input bg-card',
          disabled && 'opacity-50',
        )}
      >
        <Text
          className={cn(
            'text-base font-sans flex-1',
            value ? 'text-foreground' : 'text-muted-foreground',
          )}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <Icon name={icon} size="sm" />
      </Pressable>
    </View>
  );
}
