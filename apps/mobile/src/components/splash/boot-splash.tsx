import { brandColorHex } from '@navis/theme';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { ChartLines } from '@/components/auth/chart-lines';
import { SPLASH_BOAT_SIZE, SailingBoat } from '@/components/splash/sailing-boat';

/** Lo que dura la travesía antes de descubrir la app: lo justo para que se vea navegar. */
const SAIL_MS = 1900;
const SAIL_REDUCED_MS = 600;
const FADE_MS = 350;
const SEA_HEIGHT = 260;

/**
 * El splash animado: **todo el cuadro en el azul de la marca** y el barco
 * blanco en el centro —lo mismo que pinta el splash nativo, que es estático—
 * pero navegando sobre las curvas de nivel de la carta, que derivan.
 *
 * Hace el relevo sin huecos: el nativo se mantiene (`preventAutoHideAsync`, en
 * el layout raíz) hasta que este cuadro está maquetado, y solo entonces se
 * oculta. Pasado el tiempo se funde y se desmonta.
 *
 * El fundido es un `opacity` propio y no la animación de salida (`exiting`) de
 * Reanimated: esa dependía de que el motor de layout terminase de quitar la
 * vista, y aquí dejaba el cuadro azul congelado encima de la app.
 */
export function BootSplash() {
    const reducedMotion = useReducedMotion();
    const { height } = useWindowDimensions();
    const [visible, setVisible] = useState(true);
    const opacity = useSharedValue(1);
    const sail = reducedMotion ? SAIL_REDUCED_MS : SAIL_MS;

    useEffect(() => {
        opacity.value = withDelay(sail, withTiming(0, { duration: FADE_MS }));
        const timer = setTimeout(() => setVisible(false), sail + FADE_MS);
        return () => clearTimeout(timer);
    }, [sail, opacity]);

    const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

    if (!visible) return null;

    return (
        <Animated.View
            style={[styles.overlay, fade]}
            onLayout={() => void SplashScreen.hideAsync()}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
        >
            <SailingBoat />
            {/* El mar va delante del casco y apenas se ve (curvas al 16–30 %): la línea de agua. */}
            <View
                pointerEvents="none"
                style={[styles.sea, { top: height / 2 + SPLASH_BOAT_SIZE * 0.2 }]}
            >
                <ChartLines height={SEA_HEIGHT} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandColorHex,
        zIndex: 1000,
        elevation: 1000,
    },
    sea: { position: 'absolute', left: 0, right: 0, height: SEA_HEIGHT },
});
