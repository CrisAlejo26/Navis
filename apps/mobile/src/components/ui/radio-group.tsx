import { View } from 'react-native';

import { ControlRow } from '@/components/ui/control-row';
import { cn } from '@/lib/cn';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

function RadioGlyph({ selected }: { selected: boolean }) {
  return (
    <View
      className={cn(
        'h-5 w-5 items-center justify-center rounded-full border-2',
        selected ? 'border-primary' : 'border-input',
      )}
    >
      {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
    </View>
  );
}

/** Selección única, gestionada por el propio grupo — Fase 6. */
export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: RadioGroupProps<T>) {
  return (
    <View accessibilityRole="radiogroup">
      {options.map((option) => (
        <ControlRow
          key={option.value}
          label={option.label}
          description={option.description}
          accessibilityRole="radio"
          selected={option.value === value}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          control={<RadioGlyph selected={option.value === value} />}
        />
      ))}
    </View>
  );
}
