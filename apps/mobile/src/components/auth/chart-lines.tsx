import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/**
 * Las curvas de nivel de una carta náutica: el elemento firma de las
 * pantallas de acceso (Regla 9), portado 1:1 desde
 * `apps/web/src/components/auth/chart-lines.tsx` — mismos seis contornos,
 * misma cadencia (26 s / 42 s a la inversa). Ahí es un `<svg>` con
 * `animation: drift`; aquí, `react-native-svg` + un `translateX` en bucle.
 */
const CONTOURS = [
  { y: 34, amplitude: 16, opacity: 0.16 },
  { y: 72, amplitude: 11, opacity: 0.26 },
  { y: 106, amplitude: 20, opacity: 0.14 },
  { y: 144, amplitude: 13, opacity: 0.3 },
  { y: 178, amplitude: 19, opacity: 0.16 },
  { y: 212, amplitude: 10, opacity: 0.22 },
] as const;

const contourPath = ({ y, amplitude: a }: (typeof CONTOURS)[number]): string =>
  `M0 ${String(y)} C66 ${String(y - a)} 133 ${String(y + a)} 200 ${String(y)}` +
  ` C266 ${String(y - a)} 333 ${String(y + a)} 400 ${String(y)}`;

function Band({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 240" preserveAspectRatio="none">
      {CONTOURS.map((contour) => (
        <Path
          key={contour.y}
          d={contourPath(contour)}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.25}
          strokeOpacity={contour.opacity}
        />
      ))}
    </Svg>
  );
}

/** Una capa: dos bandas seguidas que se desplazan media vuelta, sin costura. */
function DriftLayer({
  width,
  height,
  duration,
  reverse = false,
  opacity = 1,
  scaleY = 1,
}: {
  width: number;
  height: number;
  duration: number;
  reverse?: boolean;
  opacity?: number;
  scaleY?: number;
}) {
  const reducedMotion = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    x.value = withRepeat(
      withTiming(reverse ? width : -width, { duration, easing: Easing.linear }),
      -1,
    );
  }, [reducedMotion, width, duration, reverse, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scaleY }],
  }));

  return (
    <Animated.View style={[{ flexDirection: 'row', width: width * 2, height, opacity }, style]}>
      <Band width={width} height={height} />
      <Band width={width} height={height} />
    </Animated.View>
  );
}

/** Dos capas a distinta velocidad: la de atrás da profundidad a la de delante. */
export function ChartLines({ height = 220 }: { height?: number }) {
  const { width } = useWindowDimensions();

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      <DriftLayer
        width={width}
        height={height}
        duration={42_000}
        reverse
        opacity={0.6}
        scaleY={1.4}
      />
      <DriftLayer width={width} height={height} duration={26_000} />
    </View>
  );
}
