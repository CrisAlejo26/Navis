import { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import splashIcon from '../../../assets/splash-icon.png';

/** El lado del barco: el mismo `imageWidth` del splash nativo (`app.config.ts`), para que el relevo no salte. */
export const SPLASH_BOAT_SIZE = 200;

const SWAY = Easing.inOut(Easing.sin);

/**
 * El barco del splash, **navegando**: se mece de proa a popa (balanceo) y sube
 * y baja con la ola, cada movimiento a su ritmo —la ola va al doble de
 * velocidad que el balanceo— para que no se lea como un péndulo. Arranca
 * quieto y en el mismo sitio que el splash nativo, y solo entonces toma la
 * mar: sin salto al pasar de uno a otro.
 *
 * Solo `transform`, que es lo que sabe animar el compositor (Regla 9 §5). Con
 * «reducir movimiento» se queda quieto.
 */
export function SailingBoat() {
    const reducedMotion = useReducedMotion();
    const roll = useSharedValue(0);
    const heave = useSharedValue(0);

    useEffect(() => {
        if (reducedMotion) return;
        const swing = (half: number) =>
            withSequence(
                withTiming(1, { duration: half / 2, easing: SWAY }),
                withRepeat(
                    withSequence(
                        withTiming(-1, { duration: half, easing: SWAY }),
                        withTiming(1, { duration: half, easing: SWAY }),
                    ),
                    -1,
                ),
            );
        roll.value = swing(1300);
        heave.value = swing(650);
    }, [reducedMotion, roll, heave]);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: heave.value * -6 }, { rotate: `${String(roll.value * 4.5)}deg` }],
    }));

    return (
        <Animated.View style={[{ width: SPLASH_BOAT_SIZE, height: SPLASH_BOAT_SIZE }, style]}>
            <Image
                source={splashIcon}
                accessibilityIgnoresInvertColors
                style={{ width: SPLASH_BOAT_SIZE, height: SPLASH_BOAT_SIZE }}
            />
        </Animated.View>
    );
}
