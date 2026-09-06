import type { DashboardBucket } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Text, View } from 'react-native';

import { formatNumber } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/**
 * Un reparto en barra apilada, con el color de cada cosa (RFC 0001, RFC
 * 0010 §8.3): la sede, la labor o el don ya tiene color propio en toda la
 * aplicación. Espejo de `BucketBars` de la web —el mismo dato, la misma
 * forma—, con la barra hecha de vistas en vez de `<span>` (RN no tiene flex
 * automático entre hermanos sin `flex: count`).
 */
export function BucketBars({
  title,
  buckets,
}: {
  title: string;
  buckets: readonly DashboardBucket[];
}) {
  const theme = useThemeStore((state) => state.resolvedTheme);
  const total = buckets.reduce((suma, one) => suma + one.count, 0);
  if (total === 0) return null;

  return (
    <View className="gap-3 p-5 rounded-xl border border-border bg-card">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>

      <View className="h-3 flex-row overflow-hidden rounded-full bg-muted">
        {buckets.map((one) => (
          <View
            key={one.label}
            style={{ flex: one.count, backgroundColor: accentHex(one.accent, theme) }}
          />
        ))}
      </View>

      <View className="gap-x-4 gap-y-1.5 flex-row flex-wrap">
        {buckets.map((one) => (
          <View key={one.label} className="gap-1.5 flex-row items-center">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: accentHex(one.accent, theme) }}
            />
            <Text className="text-xs text-foreground">{one.label}</Text>
            <Text className="text-xs font-medium text-muted-foreground tabular-nums">
              {formatNumber(one.count)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
