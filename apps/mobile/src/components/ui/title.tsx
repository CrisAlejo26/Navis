import { Text, type TextProps } from 'react-native';
import type { TypeLevel } from '@navis/theme';

import { cn } from '@/lib/cn';
import { typeStyle } from '@/lib/ui/type-style';

type Size = 'xl' | 'lg' | 'md';

const LEVELS: Record<Size, TypeLevel> = { xl: 'display', lg: 'h1', md: 'h2' };

/**
 * El tracking cerrado en los tamaños grandes es la firma tipográfica de
 * Navis (Regla 9 §4): un Caslon editorial con las letras algo juntas. Solo
 * vive aquí — ni `Subtitle` ni `BodyText` lo llevan, para que siga leyéndose
 * como un rasgo y no como el tono por defecto de todo el texto.
 */
const TRACKING: Partial<Record<Size, number>> = { xl: -0.5, lg: -0.3 };

interface TitleProps extends TextProps {
  size?: Size;
  className?: string;
}

/**
 * Título de pantalla o de sección (Fase 1 de
 * `docs/sistema-componentes-movil-plan.md`). `accessibilityRole="header"`
 * deja que un lector de pantalla salte entre títulos, como en la web con las
 * etiquetas `h1`-`h3`. `style` se acepta y se compone detrás del de la
 * escala (RN admite un array): así un caso como la opacidad del eslogan de
 * acceso, que no tiene clase de Tailwind en nativo (Regla 3 §5), sigue
 * pudiendo pasarse sin perder el tamaño ni la fuente.
 */
export function Title({ size = 'lg', className, children, style, ...props }: TitleProps) {
  return (
    <Text
      accessibilityRole="header"
      className={cn('text-foreground', className)}
      style={[{ ...typeStyle(LEVELS[size]), letterSpacing: TRACKING[size] }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}
