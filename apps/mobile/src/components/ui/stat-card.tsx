import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { hexAlpha } from '@/lib/color';
import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

type ChangeDirection = 'up' | 'down' | 'flat';
type ChangeTone = 'success' | 'destructive' | 'default';

const ARROW: Record<ChangeDirection, IoniconName> = {
    up: 'arrow-up',
    down: 'arrow-down',
    flat: 'remove',
};

const TONE: Record<ChangeDirection, ChangeTone> = {
    up: 'success',
    down: 'destructive',
    flat: 'default',
};

const TEXT_KEY: Record<ChangeTone, keyof ThemeColors> = {
    success: 'success',
    destructive: 'destructive',
    default: 'mutedForeground',
};

type StatTone = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'accent';

interface StatCardProps {
    label: string;
    /** El valor ya formateado (número, unidad…): la tarjeta no sabe de formato. */
    value: string;
    icon?: IoniconName;
    /** El tono del icono: qué significa esta cifra, no solo qué la ilustra. */
    tone?: StatTone;
    /** Indicador de cambio: dirección + texto. Nunca solo color (Regla 3 §7). */
    change?: { direction: ChangeDirection; text: string };
    /** Fondo y filo teñidos con el tono, en vez del blanco de `bg-card`. */
    tinted?: boolean;
    className?: string;
}

/**
 * Tarjeta de estadística compacta (Fase 10 de
 * `docs/planes/implementados/sistema-componentes-movil-plan.md`): número grande + etiqueta + icono
 * opcional + indicador de cambio con flecha, texto y color — el patrón de
 * Dock/Copilot que enseña Refero (número grande, etiqueta pequeña, variación
 * debajo).
 */
export function StatCard({
    label,
    value,
    icon,
    tone = 'default',
    change,
    tinted = false,
    className,
}: StatCardProps) {
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const toneHex = tone === 'default' ? palette.mutedForeground : palette[tone];
    // Más cuerpo en oscuro: el mismo tinte sobre un fondo casi negro se pierde.
    const dark = resolvedTheme === 'dark';
    const tint = tinted
        ? {
              backgroundColor: hexAlpha(toneHex, dark ? 0.16 : 0.1),
              borderColor: hexAlpha(toneHex, dark ? 0.35 : 0.28),
          }
        : undefined;

    return (
        <View
            className={cn(
                'gap-2 p-4 rounded-xl border',
                !tinted && 'border-border bg-card',
                className,
            )}
            style={tint}
        >
            <View className="gap-2 flex-row items-center">
                {icon ? <Icon name={icon} size="sm" tone={tone} background="soft" /> : null}
                <Text className="text-sm font-sans text-muted-foreground" numberOfLines={1}>
                    {label}
                </Text>
            </View>

            {/* Una sola línea y, si no cabe, se encoge: un valor largo ensanchaba la tarjeta
          hacia abajo y la dejaba más alta que la de al lado. */}
            <Text
                className="text-2xl font-sans-semibold text-foreground tabular-nums"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
            >
                {value}
            </Text>

            {change ? (
                <View className="gap-1 flex-row items-center">
                    <Icon name={ARROW[change.direction]} size="sm" tone={TONE[change.direction]} />
                    <Text
                        className="text-xs font-sans-medium"
                        style={{ color: palette[TEXT_KEY[TONE[change.direction]]] }}
                    >
                        {change.text}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}
