import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  className?: string;
}

/** Campo de texto con etiqueta y mensaje de error, equivalente al `Input` web. */
export function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className={cn(
          'h-11 px-3 text-base rounded-lg border border-input bg-card text-foreground',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}
