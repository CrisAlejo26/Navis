import { Ionicons } from '@expo/vector-icons';
import type { ProphecyListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { PROPHECY_STATE_ICONS, PROPHECY_STATE_TONE } from '@/components/prophecies/prophecy-icons';
import { hexAlpha } from '@/lib/color';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

interface ProphecyCardProps {
  prophecy: ProphecyListItem;
  onPress: () => void;
  /** Gesto hacia la derecha: anotar un cumplimiento sin salir del listado. */
  onAddFulfillment?: (id: string) => void;
  /** Gesto hacia la izquierda: editar, con la profecía entera ya pedida. */
  onEdit?: (id: string) => void;
}

/**
 * La tarjeta de la vista «Fichas», con la misma anatomía que
 * `BelieverCard` (Regla 1): un roundel de icono en vez de avatar —el estado
 * es lo que identifica a una profecía, no una persona—, cabecera con
 * título y fecha, pastilla de estado, extracto y un carril de cierre con el
 * recuento de cumplimientos, a juego con `CountTag` de creyentes. Los mismos
 * gestos que `BelieverCard`: a la derecha, anotar (el positivo, éxito); a la
 * izquierda, editar.
 */
export function ProphecyCard({ prophecy, onPress, onAddFulfillment, onEdit }: ProphecyCardProps) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const tone = PROPHECY_STATE_TONE[prophecy.state];
  const toneHex = palette[tone];

  return (
    <SwipeableRow
      left={
        onAddFulfillment
          ? {
              icon: 'checkmark-done-outline',
              label: t('prophecies.swipeFulfillment'),
              color: palette.success,
              foreground: palette.successForeground,
              onAction: () => onAddFulfillment(prophecy.id),
            }
          : undefined
      }
      right={
        onEdit
          ? {
              icon: 'create-outline',
              label: t('common.edit'),
              color: palette.primary,
              foreground: palette.primaryForeground,
              onAction: () => onEdit(prophecy.id),
            }
          : undefined
      }
    >
      <Pressable
        onPress={onPress}
        className="gap-2.5 p-4 rounded-2xl border bg-card active:scale-[0.98]"
        style={{ borderColor: hexAlpha(toneHex, 0.35) }}
      >
        <View className="gap-2.5 flex-row items-center">
          <Icon
            name={PROPHECY_STATE_ICONS[prophecy.state]}
            tone={tone}
            background="soft"
            size="md"
          />
          <View className="gap-0.5 min-w-0 flex-1">
            <Text className="text-base font-sans-semibold text-foreground" numberOfLines={1}>
              {prophecy.title}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {t('prophecies.receivedOn', { date: formatDay(prophecy.receivedAt) })}
            </Text>
          </View>
          <Badge label={t(`prophecies.state.${prophecy.state}`)} tone={tone} />
        </View>

        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {prophecy.excerpt}
        </Text>

        <View className="gap-2 flex-row items-center justify-between">
          <Text className="text-xs flex-1 text-muted-foreground" numberOfLines={1}>
            {prophecy.fulfilledAt
              ? t('prophecies.fulfilledOn', { date: formatDay(prophecy.fulfilledAt) })
              : t('prophecies.waitingFor', { days: prophecy.waitingDays })}
          </Text>
          {prophecy.fulfillmentsCount > 0 ? (
            <CountPill
              icon="checkmark-done-outline"
              count={prophecy.fulfillmentsCount}
              color={toneHex}
              label={t('prophecies.fulfillmentsTotal', { total: prophecy.fulfillmentsCount })}
            />
          ) : null}
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

/** Pastilla de recuento a juego con `CountTag` de `believer-card.tsx` (Regla 1). */
function CountPill({
  icon,
  count,
  color,
  label,
}: {
  icon: 'checkmark-done-outline';
  count: number;
  color: string;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      className="gap-1 flex-row items-center rounded-full"
      style={{
        paddingLeft: 7,
        paddingRight: 9,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: hexAlpha(color, 0.45),
      }}
    >
      <Ionicons name={icon} size={11} color={color} aria-hidden />
      <Text className="font-sans-semibold text-[11px] tabular-nums" style={{ color }}>
        {count}
      </Text>
    </View>
  );
}
