import { themeColorHex } from '@navis/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useThemeStore } from '@/lib/theme';

interface BelieversSceneProps {
  /** Desplazamiento del listado: mueve los arcos a distintas velocidades. */
  scrollY: SharedValue<number>;
}

/**
 * La cabecera de creyentes, en **arcos de vidrio**: un gradiente del azul
 * fuerte de la marca —el mismo de la barra de navegación activa— y dos
 * familias de arcos gigantes y translúcidos que se cruzan — vidrio
 * esmerilado —, en la dirección de Tripolis-Park™ pero con la paleta de
 * Navis. De día el cielo es el azul pleno; de noche, el mismo azul hundido
 * en la penumbra.
 *
 * El fondo **no es la escena náutica del panel** (eso vive en el inicio):
 * aquí la atmósfera es geométrica y serena. El parallax son tres planos a
 * velocidades distintas — el cielo casi quieto, los arcos lejanos algo, los
 * profundos más —, todos saturados pronto para no salirse de su marco.
 *
 * Los colores son los de la ilustración: el degradado y los arcos **nunca**
 * son fondo de un control (Regla 9 §7); el buscador sigue siendo superficie
 * de vidrio flotando encima, y todo el texto de la cabecera va en blanco —
 * sobre este azul, el texto del tema no se leería.
 */

const CIELO = {
  light: ['#355cec', '#2140cf', '#1a2f9e'] as const,
  dark: ['#0a1233', '#12245e', '#1d358f'] as const,
};

/** Un arco: disco relleno suave + su línea fina, como el vidrio esmerilado. */
function Arco({
  cx,
  cy,
  r,
  fillOpacity,
  strokeOpacity,
}: {
  cx: number;
  cy: number;
  r: number;
  fillOpacity: number;
  strokeOpacity: number;
}) {
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} fill="#ffffff" fillOpacity={fillOpacity} />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={strokeOpacity}
        strokeWidth={1.5}
      />
    </>
  );
}

export function BelieversScene({ scrollY }: BelieversSceneProps) {
  const tema = useThemeStore((state) => state.resolvedTheme);
  const fondo = themeColorHex[tema];
  const oscuro = tema === 'dark';
  // De día, los arcos son vidrio blanco sobre el azul pleno; de noche, luz
  // azul sobre el fondo profundo: la misma forma con otra luz.
  const vidrio = oscuro ? 0.1 : 0.08;
  const linea = oscuro ? 0.22 : 0.3;
  const velo = oscuro ? 'rgba(53,92,236,0.14)' : 'rgba(10,18,70,0.28)';

  const lejos = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(scrollY.value * 0.05, 16) }],
  }));
  const cerca = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(scrollY.value * 0.2, 44) }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: 340 }]}>
      <LinearGradient
        colors={[...CIELO[oscuro ? 'dark' : 'light']]}
        style={StyleSheet.absoluteFill}
      />
      {/* Arcos lejanos: el plano del fondo, casi inmóvil. */}
      <Animated.View style={[StyleSheet.absoluteFill, lejos]}>
        <Svg width="100%" height="100%" viewBox="0 0 375 340" preserveAspectRatio="xMidYMid slice">
          <Arco cx={400} cy={-40} r={270} fillOpacity={vidrio} strokeOpacity={linea} />
          <Arco cx={430} cy={-90} r={330} fillOpacity={vidrio * 0.7} strokeOpacity={linea * 0.6} />
        </Svg>
      </Animated.View>
      {/* Arcos cercanos: el velo profundo que entra por abajo. */}
      <Animated.View style={[StyleSheet.absoluteFill, cerca]}>
        <Svg width="100%" height="100%" viewBox="0 0 375 340" preserveAspectRatio="xMidYMid slice">
          <Circle cx={60} cy={430} r={260} fill={velo} />
          <Circle cx={340} cy={460} r={300} fill={velo} />
        </Svg>
      </Animated.View>
      {/* La cola: los arcos se deshacen en el fondo de la pantalla. */}
      <LinearGradient
        colors={['transparent', fondo]}
        locations={[0.2, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 }}
      />
    </View>
  );
}
