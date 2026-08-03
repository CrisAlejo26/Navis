import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const containers: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const labels: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-13 px-6',
};

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
}

/** Equivalente móvil del `Button` de la web: mismas variantes y mismos tokens. */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'gap-2 flex-row items-center justify-center rounded-lg active:opacity-80',
        containers[variant],
        sizes[size],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" /> : null}
      <Text className={cn('text-base font-medium', labels[variant])}>{title}</Text>
    </Pressable>
  );
}
