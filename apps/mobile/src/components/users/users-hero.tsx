import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { readableGradient } from '@/lib/color';
import { formatNumber } from '@/lib/format';
import { useUserPalette } from './user-theme';

export interface RoleSegment {
    slug: string;
    color: string;
    count: number;
}

/**
 * La cifra de la pantalla —cuentas o roles— y cómo se reparte por rol. El
 * degradado toma el color del rol que se está filtrando (el azul de la marca si
 * no hay ninguno) — es el elemento firma de la pantalla (Regla 9 §4). Las
 * proporciones salen del catálogo; los nombres, de los chips de debajo.
 */
export function UsersHero({
    label,
    total,
    caption,
    accent,
    segments,
}: {
    label: string;
    total: number;
    caption: string;
    accent: string | null;
    segments: RoleSegment[];
}) {
    const p = useUserPalette(),
        base = accent ?? p.primary,
        shown = segments.filter((one) => one.count > 0);
    return (
        <LinearGradient
            colors={readableGradient(base)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, padding: 20, marginBottom: 16, gap: 14 }}
        >
            <View style={{ gap: 2 }}>
                <Text
                    className="font-sans-semibold text-xs uppercase"
                    style={{ color: 'rgba(255,255,255,0.78)', letterSpacing: 1.2 }}
                >
                    {label}
                </Text>
                <Text
                    className="font-sans-bold"
                    style={{ color: '#ffffff', fontSize: 52, lineHeight: 60 }}
                    accessibilityRole="header"
                >
                    {formatNumber(total)}
                </Text>
                <Text
                    className="text-sm"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                    numberOfLines={3}
                >
                    {caption}
                </Text>
            </View>
            {shown.length > 1 && (
                <View
                    aria-hidden
                    className="flex-row overflow-hidden"
                    style={{ height: 10, borderRadius: 5, gap: 2 }}
                >
                    {shown.map((one) => (
                        <View
                            key={one.slug}
                            style={{ flex: one.count, backgroundColor: one.color }}
                        />
                    ))}
                </View>
            )}
        </LinearGradient>
    );
}
