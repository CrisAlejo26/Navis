import { wakeShape, type DashboardWeekActivity } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { formatDay, formatNumber } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

const ANCHO = 320;
const ALTO = 64;

/**
 * Notas escritas por semana, las últimas seis (RFC 0001). La misma estela que
 * ya dibuja una lista compartida (`packages/shared/src/wake-path.ts`): el
 * mismo rastro de barco, aquí con `react-native-svg` en vez de un `<svg>` del
 * DOM (Regla 9 §7: reutilizar el motivo es la firma).
 */
export function ActivityCard({ weeks }: { weeks: readonly DashboardWeekActivity[] }) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const total = weeks.reduce((suma, one) => suma + one.notes, 0);
  const shape = wakeShape(
    weeks.map((one) => one.notes),
    ANCHO,
    ALTO,
  );
  const cumbre = weeks[shape.peak];

  return (
    <View className="gap-3 p-4 rounded-xl border border-t-4 border-border border-t-primary bg-card">
      <View className="gap-2 flex-row flex-wrap items-baseline justify-between">
        <Text className="text-sm font-semibold text-foreground">{t('home.weeklyActivity')}</Text>
        <Text className="text-xs text-muted-foreground">
          {t('home.weeklyActivityTotal', { count: formatNumber(total), weeks: weeks.length })}
        </Text>
      </View>

      {!shape.enough ? (
        <Text className="text-2xl font-semibold text-foreground tabular-nums">
          {formatNumber(total)}
        </Text>
      ) : (
        <>
          <Svg width="100%" height={ALTO} viewBox={`0 0 ${String(ANCHO)} ${String(ALTO)}`}>
            <Path d={shape.area} fill={palette.primary} fillOpacity={0.75} />
            <Line
              x1={0}
              y1={ALTO / 2}
              x2={ANCHO}
              y2={ALTO / 2}
              stroke={palette.primary}
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            {shape.peak >= 0 && (
              <Circle
                cx={shape.points[shape.peak]?.x ?? 0}
                cy={ALTO / 2}
                r={3}
                fill={palette.primary}
              />
            )}
          </Svg>

          <View className="gap-1.5 flex-row">
            {weeks.map((week) => (
              <Text
                key={week.week}
                className="flex-1 text-center text-[10px] text-muted-foreground"
              >
                {formatDay(week.week, 'short')}
              </Text>
            ))}
          </View>

          {cumbre && (
            <Text className="text-xs text-muted-foreground">
              {t('home.weeklyActivityPeak', {
                week: formatDay(cumbre.week, 'short'),
                count: cumbre.notes,
              })}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
