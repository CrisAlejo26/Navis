import { useMemo, useRef, useState } from 'react';
import { InteractionManager, ScrollView, Share as RNShare, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
// El `Svg.toDataURL` propio de react-native-svg capturaba siempre un lienzo
// negro en este Android/Fabric —comprobado con la imagen real, no solo con
// los datos que devolvía, y en varias posiciones—, aunque la misma vista,
// delante de la persona, se viera bien. `react-native-view-shot` lo evita
// por completo: es lo que ya usa otra app de la casa para esto mismo,
// mezclando `react-native-svg` con vistas normales igual que esta lámina, y
// ahí sí captura de verdad.
// La API nueva de expo-file-system trae File/Paths; la herencia (con
// `cacheDirectory` y `copyAsync`) vive en `expo-file-system/legacy`.
// Importados aquí arriba y no con `await import(...)` dentro de la función:
// Metro no re-registra de fiar un módulo cargado bajo demanda tras un hot
// reload («Requiring unknown module»).
import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { DEFAULT_CONGREGATION_ACCENT } from '@navis/shared';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { Poster } from '@/components/calendar/poster/poster';
import type { PosterAspect } from '@/components/calendar/poster/poster-size';
import { posterWidth } from '@/components/calendar/poster/poster-size';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { longDay, rangeTitle } from '@/lib/calendar/labels';
import { posterFileName } from '@/lib/calendar/share';
import { rangeAsText } from '@/lib/calendar/share-text';
import {
  SHARE_LABELS,
  SHARE_PRESETS,
  shareRangeFor,
  suggestedAspect,
  type SharePreset,
} from '@/lib/calendar/share-range';
import { useCalendarSchedule } from '@/hooks/use-calendar';

/**
 * Lo que la hoja necesita de cada sede: el id para filtrar, el nombre y el
 * color con el que se distingue de las demás en la lámina (§9.4).
 */
type Sede = { id: string; name: string; accent: string };

/**
 * Cuánto se espera a que `capture()` resuelva antes de caer al texto. Una
 * tabla o un mes con varias semanas rasteriza más lento que un solo día, y de
 * sobra en un emulador.
 */
const EXPORT_TIMEOUT_MS = 9000;

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  /** El día que se está mirando: de él cuelgan los tramos (§9.1). */
  anchor: string;
  /** El día abierto, si lo hay: viene ya elegido. */
  selectedDate: string | null;
  calendarId: string;
  calendarName: string;
  churchName: string;
  congregations: readonly Sede[];
}

const ASPECTS: { value: PosterAspect; labelKey: string; hintKey: string }[] = [
  { value: 'portrait', labelKey: 'calendar.sharePortrait', hintKey: 'calendar.sharePortraitHint' },
  { value: 'table', labelKey: 'calendar.shareTable', hintKey: 'calendar.shareTableHint' },
  {
    value: 'landscape',
    labelKey: 'calendar.shareLandscape',
    hintKey: 'calendar.shareLandscapeHint',
  },
];

/**
 * La hoja de compartir en móvil —el espejo de `share-sheet.tsx` de la web
 * (§9)—: **qué** tramo se manda (de un día al mes entero), **con qué forma**
 * (vertical, tabla o apaisada, propuesta según el tramo) y una vista previa
 * compacta, ajustada al ancho.
 *
 * El PNG **no** sale de esa vista previa —a tamaño real se sale de la
 * pantalla, y encogerla para que quepa habría encogido también la
 * captura—: sale de una segunda instancia del mismo `Poster`, a su tamaño
 * real, oculta fuera de la pantalla, con `react-native-view-shot`. El texto
 * es el respaldo que siempre funciona (§9.3): si el rasterizado falla, se
 * manda el tramo escrito.
 */
export function ShareSheet({
  visible,
  onClose,
  anchor,
  selectedDate,
  calendarId,
  calendarName,
  churchName,
  congregations,
}: ShareSheetProps) {
  const { t } = useTranslation();
  const posterRef = useRef<ViewShotRef | null>(null);

  const [preset, setPreset] = useState<SharePreset>(selectedDate ? 'day' : 'week');
  const [aspect, setAspect] = useState<PosterAspect | null>(null);
  const chosen = aspect ?? suggestedAspect(preset);
  const [sedesFiltro, setSedesFiltro] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);

  const tramo = shareRangeFor(preset, anchor, selectedDate);
  const { data: schedule } = useCalendarSchedule(calendarId, tramo.from, tramo.to);

  const acotado = useMemo(() => {
    if (!schedule) return undefined;
    const days =
      sedesFiltro.length === 0
        ? schedule.days
        : schedule.days.map((day) => ({
            ...day,
            meetings: day.meetings.filter((one) => sedesFiltro.includes(one.congregationId)),
          }));
    return { ...schedule, days };
  }, [schedule, sedesFiltro]);

  const names = useMemo(
    () => new Map((acotado?.congregations ?? congregations).map((one) => [one.id, one.name])),
    [acotado?.congregations, congregations],
  );
  const nameOf = (id: string) => names.get(id) ?? '';
  const accents = useMemo(
    () => new Map((acotado?.congregations ?? congregations).map((one) => [one.id, one.accent])),
    [acotado?.congregations, congregations],
  );
  const accentOf = (id: string) => accents.get(id) ?? DEFAULT_CONGREGATION_ACCENT;
  const showCongregation = sedesFiltro.length !== 1 && congregations.length > 1;
  const title = tramo.from === tramo.to ? longDay(tramo.from) : rangeTitle(tramo.from, tramo.to);
  const sede = sedesFiltro.length === 1 ? nameOf(sedesFiltro[0] ?? '') : undefined;
  // La lámina dice de qué calendario es —y de qué sede, si es de una sola—:
  // quien la recibe no tiene por qué adivinarlo.
  const soleName = [calendarName, sede].filter(Boolean).join(' · ');

  const baseW = acotado ? posterWidth(chosen, acotado) : 1080;

  async function enviarImagen(): Promise<void> {
    if (!acotado) return;
    setBusy(true);

    try {
      // Antes de capturar, se espera a que termine cualquier animación en
      // curso —la propia hoja abriéndose, o el cambio de tramo/formato que
      // acaba de pulsar la persona— y a un fotograma más: `capture()` puede
      // leer un lienzo que todavía no ha terminado su primera pasada de
      // layout nativa.
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(resolve);
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      // Carrera contra un tope de tiempo: si `capture()` nunca resuelve, no
      // hay excepción que el `catch` pueda atrapar, y sin este tope el botón
      // se queda cargando para siempre en vez de caer al texto. El
      // temporizador se cancela en cuanto `capture()` gana la carrera.
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const capturado = await Promise.race([
        posterRef.current?.capture() ?? Promise.resolve(''),
        new Promise<string>((resolve) => {
          timeoutId = setTimeout(() => resolve(''), EXPORT_TIMEOUT_MS);
        }),
      ]);
      clearTimeout(timeoutId);
      if (!capturado) return void (await enviarTexto());

      // `capture()` deja el PNG con un nombre de caché genérico: se renombra
      // al del tramo antes de compartir.
      const destino = `${cacheDirectory}${posterFileName(tramo.from, tramo.to, sede)}`;
      await copyAsync({ from: capturado, to: destino });

      await shareAsync(destino, { mimeType: 'image/png', UTI: 'public.png' });
    } catch (error) {
      // Sin imagen no se deja a nadie tirado: el texto siempre sale (§9.3).
      // El fallo queda en consola: si alguna vez se cae aquí, que se vea.
      console.warn('[navis] la lámina no salió como imagen', error);
      await enviarTexto();
    } finally {
      setBusy(false);
    }
  }

  async function enviarTexto(): Promise<void> {
    if (!acotado) return;

    const texto = rangeAsText(acotado, {
      dayLabel: longDay,
      congregationName: nameOf,
      showCongregation,
      unassigned: t('calendar.unassigned'),
    });

    await RNShare.share({
      title: churchName,
      message: `${churchName}\n${title}\n\n${texto}`,
    });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('calendar.share')}>
      <View className="gap-3">
        {/*
         * Tres preguntas distintas, tres bloques con su título, como en la
         * web (§9): qué tramo, de qué sede y con qué forma. Sin la etiqueta,
         * las pastillas de las tres preguntas se leían como una sola lista
         * revuelta. Y de lado en vez de envolver: con seis tramos y varias
         * sedes, el ajuste de línea amontonaba las opciones sin que se viera
         * dónde acababa una pregunta y empezaba la siguiente.
         */}
        <View className="gap-1.5">
          <Text className="font-sans-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.shareRange')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5"
          >
            {SHARE_PRESETS.map((option) => (
              <Chip
                key={option}
                label={t(SHARE_LABELS[option])}
                selected={option === preset}
                onPress={() => {
                  setPreset(option);
                  setAspect(null);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* La sede: las mismas pastillas del filtro de la pantalla (§9.1). */}
        {congregations.length > 1 ? (
          <View className="gap-1.5">
            <Text className="font-sans-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('calendar.congregations')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-1.5"
            >
              <Chip
                label={t('calendar.allCongregations')}
                selected={sedesFiltro.length === 0}
                onPress={() => setSedesFiltro([])}
              />
              {congregations.map((one) => (
                <Chip
                  key={one.id}
                  label={one.name}
                  selected={sedesFiltro.includes(one.id)}
                  onPress={() =>
                    setSedesFiltro((prev) =>
                      prev.includes(one.id)
                        ? prev.filter((id) => id !== one.id)
                        : [...prev, one.id],
                    )
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="gap-1.5">
          <Text className="font-sans-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.shareAspect')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5"
          >
            {ASPECTS.map(({ value, labelKey }) => (
              <Chip
                key={value}
                label={t(labelKey)}
                selected={chosen === value}
                onPress={() => setAspect(value)}
              />
            ))}
          </ScrollView>
          <Text className="text-xs text-muted-foreground">
            {t(ASPECTS.find(({ value }) => value === chosen)?.hintKey ?? '')}
          </Text>
        </View>

        {/*
         * La vista previa, compacta y ajustada al ancho —no la pieza que se
         * captura—: a tamaño real (`width={baseW}`) una tabla o un mes se
         * salen de la pantalla y hacían falta dos scrolls para verla entera.
         * Se ve pequeña aquí y se manda grande, porque son dos instancias
         * distintas del mismo `Poster` (abajo, la que sí se captura).
         */}
        <View className="gap-1.5 p-2 items-center rounded-xl border border-border bg-muted">
          {acotado ? (
            <Poster
              range={acotado}
              aspect={chosen}
              churchName={churchName}
              subtitle={soleName}
              title={title}
              month={anchor.slice(0, 7)}
              congregationName={nameOf}
              congregationAccent={accentOf}
              showCongregation={showCongregation}
              width={320}
            />
          ) : (
            <Text className="py-4 text-sm text-muted-foreground">{t('calendar.noProgramme')}</Text>
          )}
          <Text className="text-[11px] text-muted-foreground">{t('calendar.sharePreview')}</Text>
        </View>

        {/*
         * La lámina de verdad, a su tamaño real —de ahí sale el PNG—, oculta
         * fuera de la pantalla: el mismo sitio (opacidad, fuera de la
         * ventana) donde antes no llegaba a capturar nada con
         * `Svg.toDataURL`, pero `ViewShot` sí lee bien, como ya hace
         * Dreamkeeper con esta receta exacta (§9). `overflow: visible` para
         * que una lámina más ancha que 1 no quede recortada por su propio
         * contenedor antes de capturarla.
         */}
        {acotado ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: -9999,
              top: -9999,
              opacity: 0,
              overflow: 'visible',
            }}
          >
            <ViewShot ref={posterRef} options={{ format: 'png', quality: 1 }}>
              <Poster
                range={acotado}
                aspect={chosen}
                churchName={churchName}
                subtitle={soleName}
                title={title}
                month={anchor.slice(0, 7)}
                congregationName={nameOf}
                congregationAccent={accentOf}
                showCongregation={showCongregation}
                width={baseW}
              />
            </ViewShot>
          </View>
        ) : null}

        <Button
          title={t('calendar.shareSend')}
          leadingIcon="share-outline"
          loading={busy}
          onPress={() => {
            void enviarImagen().catch(() => undefined);
          }}
          disabled={!acotado}
        />
        <Button
          variant="secondary"
          title={t('calendar.shareAsText')}
          leadingIcon="chatbubble-ellipses-outline"
          onPress={() => {
            void enviarTexto().catch(() => undefined);
          }}
          disabled={!acotado}
        />
      </View>
    </BottomSheet>
  );
}
