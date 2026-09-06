import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';
import { typeStyle } from '@/lib/ui/type-style';

interface SubtitleProps extends TextProps {
  className?: string;
}

/**
 * Texto de apoyo bajo un `Title`, siempre al nivel `h3` de la escala: su
 * papel es acompañar, no competir con el título, así que no tiene tamaños
 * propios (patrón visto en Refero — cabecera + subtítulo de una sola línea,
 * como en Open o MasterClass).
 */
export function Subtitle({ className, children, style, ...props }: SubtitleProps) {
  return (
    <Text
      className={cn('text-muted-foreground', className)}
      style={[typeStyle('h3'), style]}
      {...props}
    >
      {children}
    </Text>
  );
}
