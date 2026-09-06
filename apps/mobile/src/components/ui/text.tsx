import { Text, type TextProps } from 'react-native';
import type { TypeLevel } from '@navis/theme';

import { cn } from '@/lib/cn';
import { typeStyle } from '@/lib/ui/type-style';

type Weight = 'regular' | 'medium';

const LEVELS: Record<Weight, TypeLevel> = { regular: 'body', medium: 'bodyMedium' };

interface BodyTextProps extends TextProps {
  weight?: Weight;
  className?: string;
}

/** Cuerpo de texto — Fase 1 de `docs/sistema-componentes-movil-plan.md`. */
export function BodyText({
  weight = 'regular',
  className,
  children,
  style,
  ...props
}: BodyTextProps) {
  return (
    <Text
      className={cn('text-foreground', className)}
      style={[typeStyle(LEVELS[weight]), style]}
      {...props}
    >
      {children}
    </Text>
  );
}

interface CaptionProps extends TextProps {
  className?: string;
}

/** Texto auxiliar pequeño: fechas, ayudas de formulario, metadatos. */
export function Caption({ className, children, style, ...props }: CaptionProps) {
  return (
    <Text
      className={cn('text-muted-foreground', className)}
      style={[typeStyle('caption'), style]}
      {...props}
    >
      {children}
    </Text>
  );
}
