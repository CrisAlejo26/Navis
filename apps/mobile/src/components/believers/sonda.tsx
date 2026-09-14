import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

type Tone = 'primary' | 'warning' | 'destructive';

const TRACK_HEIGHT = 4;
const FILL_MS = 420;

interface SondaProps {
  /** Días desde la última nota —o del alta—; lo que mide la pista. */
  daysWithoutNote: number;
  /** El margen de la persona; `null` es aviso apagado y no se pinta pista. */
  alertAfterDays: number | null;
  /** Sin ninguna nota todavía: la llamada más fuerte de la pantalla. */
  hasNotes: boolean;
  /** Cuándo fue la última nota, para la frase completa de la ficha. */
  lastNoteAt?: string | null;
  /** Posición en el listado, para escalonar el latido del desbordado. */
  index?: number;
  /** `full` añade la frase completa de la ficha, con la fecha y el margen. */
  variant?: 'compact' | 'full';
}

/**
 * La sonda (RFC 0003 §7.3): cuánto margen queda con esa persona. El relleno
 * escala de 0 a su valor al entrar —`transform: scaleX`, que el compositor
 * resuelve, y solo en la primera pintura— y quien ha agotado su margen
 * respira: opacidad en bucle, escalonada por fila, apagada con movimiento
 * reducido. El color nunca informa solo: el icono y el texto acompañan.
 */
export function Sonda({
  daysWithoutNote,
  alertAfterDays,
  hasNotes,
  lastNoteAt = null,
  index = 0,
  variant = 'compact',
}: SondaProps) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const ratio =
    alertAfterDays === null || alertAfterDays <= 0
      ? 1
      : Math.min(daysWithoutNote / alertAfterDays, 1);
  const overdue = alertAfterDays !== null && daysWithoutNote > alertAfterDays;
  const tone: Tone = overdue ? 'destructive' : ratio > 0.7 ? 'warning' : 'primary';

  useEffect(() => {
    if (reducedMotion) {
      progress.value = ratio;
      return;
    }
    progress.value = withTiming(ratio, { duration: FILL_MS });
  }, [ratio, reducedMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const beatStyle = useAnimatedStyle(() => {
    if (!overdue || reducedMotion) return { opacity: 1 };
    return {
      opacity: withDelay(
        index * 120,
        withRepeat(
          withSequence(withTiming(0.55, { duration: 1200 }), withTiming(1, { duration: 1200 })),
          -1,
          true,
        ),
      ),
    };
  }, [overdue, reducedMotion, index]);

  const label = hasNotes
    ? t('believers.alert.since', { days: daysWithoutNote })
    : t('believers.alert.never');
  const color = palette[tone];
  const textColor = overdue
    ? palette.destructive
    : hasNotes
      ? palette.mutedForeground
      : palette.warning;

  return (
    <View
      className="gap-1.5"
      accessibilityLabel={readerText(t, daysWithoutNote, alertAfterDays, hasNotes)}
    >
      <View className="gap-2 flex-row items-center">
        {alertAfterDays !== null ? (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            className="flex-1 overflow-hidden rounded-full bg-muted"
            style={{ height: TRACK_HEIGHT }}
          >
            <Animated.View
              style={[
                {
                  height: TRACK_HEIGHT,
                  borderRadius: TRACK_HEIGHT / 2,
                  backgroundColor: color,
                  width: `${Math.max(ratio * 100, daysWithoutNote > 0 ? 6 : 0)}%`,
                  transformOrigin: 'left center',
                },
                fillStyle,
                beatStyle,
              ]}
            />
          </View>
        ) : null}
        <View className="gap-1 flex-row items-center">
          {overdue ? (
            <Ionicons
              name="warning"
              size={12}
              color={palette.destructive}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          ) : null}
          <Text className="text-xs tabular-nums" style={{ color: textColor }}>
            {label}
          </Text>
        </View>
      </View>
      {variant === 'full' ? (
        <Text className="text-xs text-muted-foreground">
          {hasNotes && lastNoteAt
            ? `${t('believers.alert.lastNote', { date: formatDay(lastNoteAt) })} · `
            : ''}
          {t('believers.alert.margin', { days: alertAfterDays ?? 0 })}
        </Text>
      ) : null}
    </View>
  );
}

/** Lo que lee un lector de pantalla: la pista va oculta, esto es la voz. */
function readerText(
  t: (key: string, values?: Record<string, unknown>) => string,
  days: number,
  margin: number | null,
  hasNotes: boolean,
): string {
  if (!hasNotes && margin !== null) return t('believers.alert.readerNever', { margin });
  if (margin === null) return t('believers.alert.readerOff', { days });
  return t('believers.alert.reader', { days, margin });
}
