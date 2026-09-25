import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';

const TEXT_KEY: Record<BadgeTone, keyof ThemeColors> = {
    primary: 'primary',
    accent: 'accent',
    success: 'success',
    warning: 'warning',
    destructive: 'destructive',
    muted: 'mutedForeground',
};

interface BadgeProps {
    label: string;
    tone?: BadgeTone;
    /** Icono decorativo delante del texto: se oculta del lector de pantalla (Regla 2). */
    icon?: IoniconName;
    className?: string;
    /**
     * Sobre una escena de fondo (el retrato de la ficha): pastilla blanca
     * sólida con el texto en el tono — el tinte suave desaparece contra el
     * degradado.
     */
    onScene?: boolean;
}

/**
 * Pastilla de estado que no se toca — la `Badge` de la web portada a móvil
 * (Fase 9 de `docs/planes/implementados/sistema-componentes-movil-plan.md`, adelantada de la Fase
 * 13 §18.1). A diferencia de la web (fondo sólido), aquí el tinte es suave
 * (`hexAlpha`, el mismo lenguaje que `Icon`) para no saturar: el color nunca
 * va solo, siempre con el texto que lo explica (Regla 3 §7).
 */
export function Badge({ label, tone = 'muted', icon, className, onScene = false }: BadgeProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const toneHex = palette[TEXT_KEY[tone]];

    return (
        <View
            accessibilityRole="text"
            className={cn('px-2.5 py-1 gap-1 flex-row items-center rounded-full', className)}
            style={{
                backgroundColor: onScene ? 'rgba(255,255,255,0.92)' : hexAlpha(toneHex, 0.14),
            }}
        >
            {icon ? (
                <Icon
                    name={icon}
                    size="sm"
                    color={onScene ? toneHex : undefined}
                    tone={onScene ? undefined : tone === 'muted' ? 'default' : tone}
                />
            ) : null}
            <Text className="text-xs font-sans-medium" style={{ color: toneHex }}>
                {label}
            </Text>
        </View>
    );
}
