/**
 * Los cuatro colores de una acción, con tokens que cambian solos entre temas
 * (Regla 3). Van en su propio fichero y no junto al componente: un módulo con un
 * componente solo exporta componentes, o se rompe el recambio en caliente
 * (CLAUDE.md).
 */
export type IconActionTone = 'primary' | 'destructive' | 'warning' | 'success';

/** El color del icono cuando va dentro de un botón con texto. */
export const ICON_TONE_TEXT: Record<IconActionTone, string> = {
    primary: 'text-primary',
    destructive: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
};

/** El color del icono y el fondo suave al pasar por encima, para un botón de solo icono. */
export const ICON_TONE_BUTTON: Record<IconActionTone, string> = {
    primary: 'text-primary hover:bg-primary/10',
    destructive: 'text-destructive hover:bg-destructive/10',
    warning: 'text-warning hover:bg-warning/10',
    success: 'text-success hover:bg-success/10',
};
