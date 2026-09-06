import { useState, type ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Para un campo de búsqueda: la lupa ya dice de qué va, así que la
   * etiqueta se sigue pasando a `accessibilityLabel` (Regla 2) pero no se
   * pinta encima del campo. */
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
}

/**
 * Campo de texto con etiqueta, error y foco visible — Fase 4. `PasswordField`
 * y `SearchField` son envoltorios de este mismo componente: la lógica de
 * mostrar/limpiar es suya, el campo, el borde y el error son de aquí.
 *
 * El foco se marca con el color del borde, no con `ring-*` (Regla 3 punto 6):
 * ese utilitario depende de `box-shadow`, que no existe en nativo. El ancho
 * del borde no cambia entre estados —siempre `border-2`— para que marcar el
 * foco no desplace el contenido de alrededor.
 */
export function TextField({
  label,
  error,
  hideLabel = false,
  leadingIcon,
  trailingIcon,
  className,
  multiline,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      {hideLabel ? null : <Text className="text-sm font-sans-medium text-foreground">{label}</Text>}
      <View
        className={cn(
          'gap-2 px-3 flex-row items-center rounded-lg border-2 bg-card',
          multiline ? 'py-3' : 'h-11',
          error ? 'border-destructive' : focused ? 'border-ring' : 'border-input',
        )}
      >
        {leadingIcon}
        <TextInput
          accessibilityLabel={label}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={cn(
            'text-base font-sans flex-1 text-foreground',
            multiline && 'min-h-20',
            className,
          )}
          {...props}
        />
        {trailingIcon}
      </View>
      {error ? (
        <View className="gap-1 flex-row items-center">
          <Icon name="alert-circle" tone="destructive" size="sm" />
          <Text className="text-sm font-sans text-destructive">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
