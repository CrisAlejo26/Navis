import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';

import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

interface PageDotsProps {
    count: number;
    activeIndex: number;
}

/**
 * Indicador de página en puntos (Fase 12): el activo es una pastilla ancha en
 * `--primary`, los demás puntos tenues — la misma firma de pastilla de Navis.
 * Solo informa (no se toca); el carrusel que lo compone es quien navega.
 */
export function PageDots({ count, activeIndex }: PageDotsProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    return (
        <View
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: Math.max(count - 1, 0), now: activeIndex }}
            className="gap-1.5 flex-row items-center justify-center"
        >
            {Array.from({ length: count }, (_, i) => {
                const active = i === activeIndex;
                return (
                    <View
                        key={i}
                        style={{
                            width: active ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: active
                                ? palette.primary
                                : hexAlpha(palette.mutedForeground, 0.4),
                        }}
                    />
                );
            })}
        </View>
    );
}
