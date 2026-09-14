import { believerName, type BelieverListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Sonda } from '@/components/believers/sonda';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';

const STATUS_TONE = {
  activo: 'success',
  nuevo: 'primary',
  inactivo: 'muted',
  trasladado: 'warning',
} as const;

interface BelieverCardProps {
  believer: BelieverListItem;
  congregationName: string | null;
  index: number;
  /** Selección en lote: cuando hay selección activa, la casilla manda. */
  selected?: boolean;
  selecting?: boolean;
  onToggleSelect?: (id: string) => void;
  onPress: (id: string) => void;
}

/**
 * La tarjeta de creyente del listado móvil: avatar, estado, sede y **la sonda
 * al pie, a todo lo ancho** — que es donde mejor se lee (§7.4). Quien ha
 * agotado su margen lleva un filete a la izquierda: es lo que se ve cuando la
 * animación del latido está apagada.
 */
export function BelieverCard({
  believer,
  congregationName,
  index,
  selected = false,
  selecting = false,
  onToggleSelect,
  onPress,
}: BelieverCardProps) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const name = believerName(believer);
  const featured =
    believer.tags.find((tag) => tag.id === believer.featuredTagId) ?? believer.tags[0] ?? null;
  const showCheckbox = selecting || selected;

  return (
    <Animated.View entering={index < 12 ? FadeInDown.delay(index * 40).springify() : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('believers.selectOne', { name })}
        onPress={() => (selecting ? onToggleSelect?.(believer.id) : onPress(believer.id))}
        onLongPress={() => onToggleSelect?.(believer.id)}
        className="gap-2.5 rounded-2xl p-4 border border-border bg-card active:opacity-90"
        style={
          believer.needsAttention
            ? { borderLeftWidth: 3, borderLeftColor: palette.destructive }
            : null
        }
      >
        <View className="gap-2.5 flex-row items-center">
          {showCheckbox ? (
            <Checkbox
              checked={selected}
              onChange={() => onToggleSelect?.(believer.id)}
              label={t('believers.selectOne', { name })}
            />
          ) : null}
          <Avatar name={name} size="md" />
          <View className="gap-0.5 flex-1">
            <Text className="text-base font-sans-semibold text-foreground" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {congregationName ?? t('believers.noCongregation')}
            </Text>
          </View>
          <Badge
            label={t(`believers.status.${believer.status}`)}
            tone={STATUS_TONE[believer.status]}
          />
        </View>

        {featured ? (
          <View className="flex-row">
            <Text
              className="text-xs font-sans-medium"
              style={{ color: tagColor(palette, featured.accent) }}
              numberOfLines={1}
            >
              {featured.name}
            </Text>
          </View>
        ) : null}

        <Sonda
          daysWithoutNote={believer.daysWithoutNote}
          alertAfterDays={believer.alertAfterDays}
          hasNotes={believer.notesCount > 0 || believer.lastNoteAt !== null}
          index={index}
        />
      </Pressable>
    </Animated.View>
  );
}

/** Un acento es un token de la paleta o un hex directo, como en la web. */
function tagColor(palette: Record<string, string>, accent: string): string {
  return accent.startsWith('#') ? accent : hexAlpha(palette[accent] ?? palette.primary, 1);
}
