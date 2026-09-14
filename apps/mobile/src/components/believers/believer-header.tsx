import { believerName, type BelieverListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';

import { Sonda } from '@/components/believers/sonda';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { useThemeStore } from '@/lib/theme';

const STATUS_TONE = {
  activo: 'success',
  nuevo: 'primary',
  inactivo: 'muted',
  trasladado: 'warning',
} as const;

/**
 * Quién es (§7.5, la columna izquierda de la web en vertical): nombre,
 * estado, sede, teléfono como enlace `tel:`, los dones y las labores como
 * etiquetas, la sonda a lo ancho con la frase completa y la trayectoria.
 */
export function BelieverHeader({
  believer,
  congregationName,
}: {
  believer: BelieverListItem;
  congregationName: string | null;
}) {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const name = believerName(believer);

  return (
    <View className="gap-4">
      <View className="gap-3 flex-row items-center">
        <Avatar name={name} size="lg" />
        <View className="gap-1 flex-1">
          <Text className="text-xl font-sans-bold text-foreground" numberOfLines={2}>
            {name}
          </Text>
          <View className="gap-1.5 flex-row flex-wrap items-center">
            <Badge
              label={t(`believers.status.${believer.status}`)}
              tone={STATUS_TONE[believer.status]}
            />
            <Text className="text-xs text-muted-foreground">
              {congregationName ?? t('believers.noCongregation')}
            </Text>
          </View>
        </View>
      </View>

      {believer.phone ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('believers.callPhone', { name })}
          onPress={() => void Linking.openURL(`tel:${believer.phone}`)}
          className="gap-2 flex-row items-center active:opacity-70"
        >
          <Icon name="call-outline" size="sm" tone="primary" />
          <Text className="text-sm" style={{ color: palette.primary }}>
            {believer.phone}
          </Text>
        </Pressable>
      ) : null}

      <Sonda
        daysWithoutNote={believer.daysWithoutNote}
        alertAfterDays={believer.alertAfterDays}
        hasNotes={believer.notesCount > 0 || believer.lastNoteAt !== null}
        lastNoteAt={believer.lastNoteAt}
        variant="full"
      />

      <TagLine
        label={t('believers.gifts')}
        values={believer.gifts.map((gift) => ({ name: gift.name, accent: gift.accent }))}
      />
      <TagLine
        label={t('believers.ministries')}
        values={believer.ministries.map((ministry) => ({
          name: ministry,
          accent: 'muted-foreground',
        }))}
      />
      <TagLine
        label={t('believerTags.title')}
        values={believer.tags.map((tag) => ({ name: tag.name, accent: tag.accent }))}
      />

      <Journey believer={believer} />
    </View>
  );
}

function TagLine({ label, values }: { label: string; values: { name: string; accent: string }[] }) {
  if (values.length === 0) return null;
  return (
    <View className="gap-1">
      <Text className="text-xs font-sans-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </Text>
      <View className="gap-1 flex-row flex-wrap items-center">
        {values.map((value, index) => (
          <Text
            key={`${value.name}-${index}`}
            className="text-sm"
            style={{ color: value.accent.startsWith('#') ? value.accent : undefined }}
          >
            {value.name}
            {index < values.length - 1 ? <Text className="text-muted-foreground"> · </Text> : null}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Journey({ believer }: { believer: BelieverListItem }) {
  const { t } = useTranslation();
  const lines: string[] = [];
  if (believer.arrivedAt) lines.push(t('believers.journey.arrived'));
  if (believer.arrivalSite)
    lines.push(t('believers.journey.arrivedLine', { what: believer.arrivalSite }));
  if (believer.bibleReadings)
    lines.push(`${t('believers.journey.bible')}: ${believer.bibleReadings}`);
  if (believer.vivenciasReadings)
    lines.push(`${t('believers.journey.vivencias')}: ${believer.vivenciasReadings}`);
  if (believer.bibleInstituteTimes)
    lines.push(`${t('believers.journey.institute')}: ${believer.bibleInstituteTimes}`);
  if (lines.length === 0) return null;

  return (
    <View className="gap-1 p-3 rounded-xl bg-muted">
      <Text className="text-xs font-sans-medium tracking-wide text-muted-foreground uppercase">
        {t('believers.journey.title')}
      </Text>
      {lines.map((line) => (
        <Text key={line} className="text-sm text-foreground">
          {line}
        </Text>
      ))}
    </View>
  );
}
