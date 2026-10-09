import { themeColorsHex } from '@navis/theme';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

function Node({ icon, caption, active }: { icon: IoniconName; caption: string; active: boolean }) {
    return (
        <View className="w-20 gap-1.5 items-center">
            <Icon
                name={icon}
                tone={active ? 'primary' : 'default'}
                background="soft"
                shape="circle"
                containerSize={56}
                size="lg"
            />
            <Text
                className="text-xs font-sans-medium text-center text-muted-foreground"
                numberOfLines={2}
            >
                {caption}
            </Text>
        </View>
    );
}

/**
 * La firma de la pantalla: la estela entre el teléfono y la instalación. Vacía
 * y discontinua mientras el teléfono trabaja solo; al vincular, se llena de
 * azul de un extremo al otro. Se anima con `transform` (nunca `width`) y se
 * queda quieta con «reducir movimiento».
 */
export function LinkTrail({
    linked,
    phoneLabel,
    serverLabel,
    description,
}: {
    linked: boolean;
    phoneLabel: string;
    serverLabel: string;
    description: string;
}) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const reduced = useReducedMotion();
    const fill = useSharedValue(linked ? 1 : 0);

    useEffect(() => {
        fill.value = reduced ? (linked ? 1 : 0) : withTiming(linked ? 1 : 0, { duration: 900 });
    }, [fill, linked, reduced]);

    const fillStyle = useAnimatedStyle(() => ({
        transform: [{ scaleX: fill.value }],
    }));

    return (
        <View
            accessible
            accessibilityLabel={description}
            className="px-3 py-6 flex-row items-start justify-between rounded-[26px] bg-card"
        >
            <Node icon="phone-portrait-outline" caption={phoneLabel} active />
            <View className="h-0.5 mt-[27px] flex-1 overflow-hidden rounded-full bg-border">
                <Animated.View
                    className="h-full rounded-full"
                    style={[
                        { backgroundColor: palette.primary, transformOrigin: 'left center' },
                        fillStyle,
                    ]}
                />
            </View>
            <Node icon="globe-outline" caption={serverLabel} active={linked} />
        </View>
    );
}
