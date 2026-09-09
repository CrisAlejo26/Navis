import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useThemeStore } from '@/lib/theme';

type RingTone = 'primary' | 'success' | 'warning' | 'destructive';

const TONE_KEY: Record<RingTone, keyof ThemeColors> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
};

interface ProgressRingProps {
  /** 0–1. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  tone?: RingTone;
  /** El valor que se pinta en el centro (un «76%», la «sonda» de una racha…). */
  label?: string;
}

/**
 * Anillo de progreso de un solo valor (Fase 11) — la «sonda» del vocabulario
 * náutico de Navis: cuánto se ha avanzado de una meta. Dibujado a mano sobre
 * `react-native-svg` (dos arcos) porque un progreso único no justifica la
 * librería de donut, y así el trazo redondo y el color son exactos, sin capa
 * de abstracción.
 */
export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  tone = 'primary',
  label,
}: ProgressRingProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={palette.muted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={palette[TONE_KEY[tone]]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          fill="none"
        />
      </Svg>
      {label ? (
        <View className="inset-0 absolute items-center justify-center">
          <Text className="text-lg font-sans-semibold text-foreground tabular-nums">{label}</Text>
        </View>
      ) : null}
    </View>
  );
}
