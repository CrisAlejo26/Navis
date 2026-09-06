import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldButton } from '@/components/ui/field-button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  placeholder: string;
  error?: string;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * Selector con hoja inferior — Fase 5. El patrón de «contenedor dominante»
 * ya investigado en `docs/referencias-app-movil.md` §1: la lista completa
 * vive en la hoja, no en un `<select>` nativo que aquí no existe.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  placeholder,
  error,
  onChange,
  disabled = false,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <FieldButton
        label={label}
        value={selected?.label}
        placeholder={placeholder}
        icon="chevron-down"
        error={error}
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View className="gap-1 pb-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'h-11 px-3 flex-row items-center justify-between rounded-lg active:bg-muted',
                  isSelected && 'bg-muted',
                )}
              >
                <Text className="text-base font-sans text-foreground">{option.label}</Text>
                {isSelected ? <Icon name="checkmark" tone="primary" size="sm" /> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
