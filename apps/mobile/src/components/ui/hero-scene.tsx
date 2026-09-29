import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useThemeStore } from '@/lib/theme';

/**
 * Los azules de la escena, más hondos arriba —ahí van los iconos de la barra
 * de estado, que son blancos— y más claros abajo. Como el degradado de la
 * ficha de profecía, son hexadecimales a mano: no hay token para un degradado.
 */
const GRADIENT = {
    light: ['#1a34b3', '#2f52e0'],
    dark: ['#0d1a55', '#1d358f'],
} as const;

const RINGS = [70, 115, 160, 205];
/** Cuánto se queda atrás cada capa respecto al scroll: la lejana, menos. */
const FAR = 0.25;
const NEAR = 0.5;

interface HeroSceneProps {
    /** El desplazamiento vertical del `ScrollView` que la contiene. */
    scrollY: SharedValue<number>;
    children: ReactNode;
}

/**
 * La escena de la portada de una sección (profecías, sueños): azul de borde a borde, desde detrás de la barra de
 * estado hasta el pie del gráfico, con el borde inferior redondeado. Detrás,
 * dos capas de formas abstractas —los anillos de una sonda y la estela de dos
 * olas— que se mueven a distinta velocidad que el contenido (paralaje). Con
 * «reducir movimiento» quedan quietas, y todo lo que se lee va en blanco sobre
 * azul hondo.
 */
export function HeroScene({ scrollY, children }: HeroSceneProps) {
    const dark = useThemeStore((state) => state.resolvedTheme) === 'dark';
    const reducedMotion = useReducedMotion();
    const far = useAnimatedStyle(() => ({
        transform: [{ translateY: reducedMotion ? 0 : scrollY.value * FAR }],
    }));
    const near = useAnimatedStyle(() => ({
        transform: [{ translateY: reducedMotion ? 0 : scrollY.value * NEAR }],
    }));

    return (
        <View className="overflow-hidden rounded-b-[40px]">
            <LinearGradient
                colors={dark ? [...GRADIENT.dark] : [...GRADIENT.light]}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.layer, far]} pointerEvents="none">
                <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 360 420"
                    preserveAspectRatio="xMaxYMin slice"
                >
                    {RINGS.map((radius, index) => (
                        <Circle
                            key={radius}
                            cx={300}
                            cy={120}
                            r={radius}
                            fill="none"
                            stroke="#ffffff"
                            strokeOpacity={0.2 - index * 0.04}
                            strokeWidth={1.5}
                        />
                    ))}
                </Svg>
            </Animated.View>
            <Animated.View style={[styles.layer, near]} pointerEvents="none">
                <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 360 420"
                    preserveAspectRatio="xMidYMax slice"
                >
                    <Path
                        d="M0 300 C 70 250, 130 350, 200 300 S 320 250, 360 290 L 360 420 L 0 420 Z"
                        fill="#ffffff"
                        fillOpacity={0.07}
                    />
                    <Path
                        d="M0 340 C 80 300, 140 380, 220 335 S 330 300, 360 330 L 360 420 L 0 420 Z"
                        fill="#ffffff"
                        fillOpacity={0.09}
                    />
                </Svg>
            </Animated.View>
            {children}
        </View>
    );
}

// Más alta que la escena, arriba y abajo, para que al desplazarse no asome el
// borde de la capa.
const styles = StyleSheet.create({
    layer: { position: 'absolute', left: 0, right: 0, top: -120, bottom: -120 },
});
