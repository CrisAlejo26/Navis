import { believerName, type BelieverListItem } from '@navis/shared';
import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { Sonda } from '@/components/believers/sonda';
import { AppBar } from '@/components/ui/app-bar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Carousel } from '@/components/ui/carousel';
import { Icon } from '@/components/ui/icon';
import { PageDots } from '@/components/ui/page-dots';
import { believerPhotoUri } from '@/data/photo-storage';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

const STATUS_TONE = {
  activo: 'success',
  nuevo: 'primary',
  inactivo: 'muted',
  trasladado: 'warning',
} as const;

/** El degradado del retrato: de azul claro de marca al pleno de la barra. */
const CIELO = {
  light: ['#4d70f0', '#2140cf'] as const,
  dark: ['#1d358f', '#101f66'] as const,
};

interface BelieverHeaderProps {
  believer: BelieverListItem;
  congregationName: string | null;
  /** Los dos iconos de la barra: la edición y el borrado van arriba. */
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Quién es (§7.5), al modo de los perfiles de Refero — Savee arriba y
 * Spoil para el carrusel —: banda de **degradado azul de marca** con la
 * barra de acciones (editar y borrar como iconos), el retrato centrado, el
 * nombre y una **fila de cuatro estadísticas** — notas, días sin hablar,
 * dones y labores. Debajo, el **carrusel de clasificación**: dones, labores
 * y etiquetas en tarjetas blancas que **avanzan solas** — con el dedo encima
 * se detienen — con sus puntos de página. La sonda completa y la
 * trayectoria cierran la parte alta, ya sobre el fondo de la pantalla.
 */
export function BelieverHeader({
  believer,
  congregationName,
  onEdit,
  onDelete,
}: BelieverHeaderProps) {
  const { t } = useTranslation();
  const tema = useThemeStore((state) => state.resolvedTheme);
  const claro = themeColorsHex[tema].primaryForeground;
  const name = believerName(believer);

  return (
    <View className="gap-5">
      <View className="rounded-b-3xl overflow-hidden">
        <LinearGradient colors={[...CIELO[tema === 'dark' ? 'dark' : 'light']]}>
          <AppBar
            onScene
            title=""
            actions={[
              { icon: 'create-outline', label: t('believers.editPerson'), onPress: onEdit },
              { icon: 'trash-outline', label: t('common.delete'), onPress: onDelete },
            ]}
          />
          <View className="gap-2 px-4 pb-5 items-center">
            <Avatar
              name={name}
              size="xl"
              photoUri={believer.hasPhoto ? believerPhotoUri(believer.id) : undefined}
              className="border-white/40 border-2"
            />
            <Text className="text-2xl font-sans-bold text-white text-center" numberOfLines={2}>
              {name}
            </Text>
            <View className="gap-2 flex-row flex-wrap items-center justify-center">
              <Badge
                onScene
                label={t(`believers.status.${believer.status}`)}
                tone={STATUS_TONE[believer.status]}
              />
              {congregationName ? (
                <Text className="text-xs" style={{ color: hexAlpha(claro, 0.75) }}>
                  {congregationName}
                </Text>
              ) : null}
            </View>
            {believer.phone ? <PhoneLink believer={believer} claro={claro} /> : null}
          </View>
          <StatsRow believer={believer} claro={claro} />
        </LinearGradient>
      </View>

      <View className="px-4">
        <Sonda
          daysWithoutNote={believer.daysWithoutNote}
          alertAfterDays={believer.alertAfterDays}
          hasNotes={believer.notesCount > 0 || believer.lastNoteAt !== null}
          lastNoteAt={believer.lastNoteAt}
          variant="full"
        />
      </View>

      <ClassCards believer={believer} />

      <View className="px-4">
        <Journey believer={believer} />
      </View>
    </View>
  );
}

/** El acento de un valor: token de la paleta o hex directo, como en la web. */
function useAccentColor(): (accent: string) => string {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  return (accent) =>
    accent.startsWith('#') ? accent : (palette[accent as keyof ThemeColors] ?? palette.primary);
}

/** Cuatro cifras del hermano, en fila — el patrón de estadísticas de Savee.
 * Los días llevan su unidad («7 d»): ningún número suelto a interpretar. */
function StatsRow({ believer, claro }: { believer: BelieverListItem; claro: string }) {
  const { t } = useTranslation();
  const stats = [
    { value: String(believer.notesCount), label: t('believers.stats.notes') },
    { value: `${believer.daysWithoutNote} d`, label: t('believers.stats.noContact') },
    { value: String(believer.gifts.length), label: t('believers.gifts') },
    { value: String(believer.ministries.length), label: t('believers.ministries') },
  ];

  return (
    <View className="pb-5 flex-row justify-around">
      {stats.map((stat) => (
        <View key={stat.label} className="gap-0.5 items-center">
          <Text className="text-xl font-sans-bold text-white tabular-nums">{stat.value}</Text>
          <Text className="text-[11px]" style={{ color: hexAlpha(claro, 0.7) }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** El teléfono, sobre el degradado también en claro. */
function PhoneLink({ believer, claro }: { believer: BelieverListItem; claro: string }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('believers.callPhone', { name: believerName(believer) })}
      onPress={() => void Linking.openURL(`tel:${believer.phone}`)}
      className="gap-1.5 flex-row items-center active:opacity-70"
    >
      <Icon name="call-outline" size="sm" color={claro} />
      <Text className="text-sm" style={{ color: claro }}>
        {believer.phone}
      </Text>
    </Pressable>
  );
}

/** Don, labor o etiqueta de una tarjeta del carrusel, en pastilla tenue. */
function Valor({ name, accent }: { name: string; accent: string }) {
  const colorOf = useAccentColor();
  const color = colorOf(accent);
  return (
    <View
      className="rounded-full"
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: hexAlpha(color, 0.12),
      }}
    >
      <Text className="font-sans-medium text-[11px]" style={{ color }} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

/** Las tarjetas de clasificación que avanzan solas (Spoil, con puntos). */
function ClassCards({ believer }: { believer: BelieverListItem }) {
  const { t } = useTranslation();
  const colorOf = useAccentColor();
  const { width } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  // La tarjeta ancha como el resto del contenido: 16 px de aire a cada lado.
  const ancho = width - 32;

  const tarjetas: {
    key: string;
    icon: IoniconName;
    accent: string;
    titulo: string;
    valores: { name: string; accent: string }[];
  }[] = [];
  if (believer.gifts.length > 0) {
    tarjetas.push({
      key: 'gifts',
      icon: 'sparkles-outline',
      accent: colorOf(believer.gifts[0].accent),
      titulo: `${t('believers.gifts')} · ${believer.gifts.length}`,
      valores: believer.gifts.map((gift) => ({ name: gift.name, accent: gift.accent })),
    });
  }
  if (believer.ministries.length > 0) {
    tarjetas.push({
      key: 'ministries',
      icon: 'construct-outline',
      accent: colorOf('primary'),
      titulo: `${t('believers.ministries')} · ${believer.ministries.length}`,
      valores: believer.ministries.map((ministry) => ({ name: ministry, accent: 'primary' })),
    });
  }
  if (believer.tags.length > 0) {
    tarjetas.push({
      key: 'tags',
      icon: 'pricetag-outline',
      accent: colorOf(believer.tags[0].accent),
      titulo: `${t('believerTags.title')} · ${believer.tags.length}`,
      valores: believer.tags.map((tag) => ({ name: tag.name, accent: tag.accent })),
    });
  }

  if (tarjetas.length === 0) {
    return (
      <Text className="text-sm text-center text-muted-foreground">
        {t('believers.noClassification')}
      </Text>
    );
  }

  return (
    <View className="gap-2 px-4 items-center">
      <Carousel itemWidth={ancho} autoMs={4000} onIndexChange={setIndice}>
        {tarjetas.map((tarjeta) => (
          <View
            key={tarjeta.key}
            className="gap-2.5 rounded-3xl p-5 items-center border border-border bg-card"
          >
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: hexAlpha(tarjeta.accent, 0.14) }}
            >
              <Ionicons name={tarjeta.icon} size={20} color={tarjeta.accent} aria-hidden />
            </View>
            <Text className="text-base font-sans-semibold text-foreground">{tarjeta.titulo}</Text>
            <View className="gap-1.5 flex-row flex-wrap items-center justify-center">
              {tarjeta.valores.map((valor, index) => (
                <Valor key={`${valor.name}-${index}`} {...valor} />
              ))}
            </View>
          </View>
        ))}
      </Carousel>
      <PageDots count={tarjetas.length} activeIndex={indice} />
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
