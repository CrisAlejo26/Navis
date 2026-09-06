import { Ionicons } from '@expo/vector-icons';
import type { DashboardAttentionPerson } from '@navis/shared';
import type { ThemeColors } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { TileHeader } from '@/components/home/tile-header';
import { hexAlpha } from '@/lib/color';
import { formatAgo, formatNumber } from '@/lib/format';

/** La inicial del nombre, para no montar la infraestructura de fotos de un
 * creyente solo para esta fila (móvil aún no implementa esa pantalla, RFC 0003). */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * El estado de la iglesia, en un solo instrumento (RFC 0001): creyentes y
 * «piden atención», las dos preguntas que se hacen juntas al abrir el panel.
 * Espejo de `StatusCard` de la web, apiladas (aquí no hay `sm:grid-cols-2`
 * porque el ancho de un teléfono ya es la columna estrecha de la web).
 */
export function StatusCard({
  believers,
  attention,
  palette,
}: {
  believers: { total: number; newThisMonth: number };
  attention: { count: number; people: readonly DashboardAttentionPerson[] };
  palette: ThemeColors;
}) {
  const { t } = useTranslation();

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <Pressable
        onPress={() => router.push('/believers')}
        className="gap-3 p-5 active:opacity-90"
        style={{ backgroundColor: palette.primary }}
      >
        <TileHeader icon="people" label={t('home.believers')} tone="filled" palette={palette} />
        <Text
          className="text-3xl font-semibold tabular-nums"
          style={{ color: palette.primaryForeground }}
        >
          {formatNumber(believers.total)}
        </Text>
        <Text className="text-xs" style={{ color: hexAlpha(palette.primaryForeground, 0.75) }}>
          {t('home.newThisMonth', { count: believers.newThisMonth })}
        </Text>
        <View className="gap-1 flex-row items-center self-start">
          <Text className="text-xs font-medium" style={{ color: palette.primaryForeground }}>
            {t('home.believersLink')}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={palette.primaryForeground} />
        </View>
      </Pressable>

      <Pressable
        onPress={() => router.push('/believers?attention=true')}
        className="gap-3 p-5 border-t border-border active:opacity-80"
      >
        <TileHeader icon="warning" label={t('home.attention')} tone="warning" palette={palette} />
        <Text className="text-3xl font-semibold text-foreground tabular-nums">
          {formatNumber(attention.count)}
        </Text>

        {attention.people.length > 0 && (
          <View className="gap-2.5">
            {attention.people.map((person) => (
              <View key={person.id} className="gap-2 flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <Text className="text-xs font-medium text-muted-foreground">
                    {initial(person.name)}
                  </Text>
                </View>
                <Text className="text-sm flex-1 text-foreground" numberOfLines={1}>
                  {person.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatAgo(person.daysWithoutNote)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="gap-1 flex-row items-center self-start">
          <Text className="text-xs font-medium text-primary">{t('home.attentionLink')}</Text>
          <Ionicons name="chevron-forward" size={13} color={palette.primary} />
        </View>
      </Pressable>
    </View>
  );
}
