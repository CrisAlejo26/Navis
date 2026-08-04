import { useCalendar } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { Copy, Download, FileText, Image as ImageIcon, Printer, Send, Type } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Poster } from '@/components/calendar/poster';
import { type PosterAspect } from '@/components/calendar/poster-size';
import { usePosterExport } from '@/components/calendar/use-poster-export';
import { usePosterImage } from '@/components/calendar/use-poster-image';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { MenuButton } from '@/components/ui/menu-button';
import { api } from '@/lib/api';
import { longDay, rangeTitle } from '@/lib/calendar/labels';
import { posterFileName } from '@/lib/calendar/share';
import { rangeAsText } from '@/lib/calendar/share-text';
import { useThemeStore } from '@/lib/theme';
import {
  SHARE_LABELS,
  SHARE_PRESETS,
  shareRangeFor,
  suggestedAspect,
  type SharePreset,
} from '@/lib/calendar/share-range';
import { cn } from '@/lib/cn';

/** Las tres formas de la lámina, con lo que hace cada una. */
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
 * Lo que hoy se hace con una captura de pantalla, hecho bien: se elige el
 * tramo, se ve cómo va a quedar y se manda (§9).
 */
export function ShareSheet({
  open,
  onClose,
  anchor,
  selectedDate,
  churchName,
  congregations,
  congregationIds,
  calendarId,
  calendarName,
}: {
  open: boolean;
  onClose: () => void;
  anchor: string;
  selectedDate: string | null;
  churchName: string;
  calendarId: string;
  /** El calendario del que es la lámina: sale en la cabecera. */
  calendarName: string;
  congregations: readonly Congregation[];
  congregationIds: readonly string[];
}) {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.resolvedTheme);
  const poster = useRef<HTMLDivElement>(null);

  const [preset, setPreset] = useState<SharePreset>(selectedDate ? 'day' : 'week');
  const [aspect, setAspect] = useState<PosterAspect | null>(null);
  const chosen = aspect ?? suggestedAspect(preset);

  const range = shareRangeFor(preset, anchor, selectedDate);
  const { data } = useCalendar(api, { ...range, calendarId, congregationIds }, open);

  const names = useMemo(
    () => new Map(congregations.map((one) => [one.id, one.name])),
    [congregations],
  );
  const nameOf = (id: string) => names.get(id) ?? '';
  const showCongregation = congregationIds.length !== 1 && congregations.length > 1;
  const title = range.from === range.to ? longDay(range.from) : rangeTitle(range.from, range.to);
  const sede = congregationIds.length === 1 ? nameOf(congregationIds[0] ?? '') : undefined;
  // La lámina dice de qué calendario es —y de qué sede, si es de una sola—:
  // quien la recibe no tiene por qué adivinarlo.
  const soleName = [calendarName, sede].filter(Boolean).join(' · ');

  const image = usePosterImage(
    poster,
    `${range.from}|${range.to}|${chosen}|${theme}|${String(data?.days.length ?? 0)}`,
  );

  const exporter = usePosterExport(poster, image.blob, {
    fileName: posterFileName(range.from, range.to, sede),
    pdfName: posterFileName(range.from, range.to, sede, 'pdf'),
    title,
    landscape: chosen === 'landscape',
    text: () =>
      data
        ? rangeAsText(data, {
            dayLabel: longDay,
            congregationName: nameOf,
            showCongregation,
            unassigned: t('calendar.unassigned'),
          })
        : '',
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('calendar.share')}
      width="min(46rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        {/*
         * Dos preguntas distintas, dos bloques con su título: **qué** tramo se
         * manda y **con qué forma**. En una sola fila de pastillas se leían
         * como una lista de nueve opciones sueltas.
         */}
        <fieldset className="gap-1.5 flex flex-col">
          <legend className="mb-1 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.shareRange')}
          </legend>
          <div className="gap-1.5 flex flex-wrap">
            {SHARE_PRESETS.map((option) => (
              <Chip
                key={option}
                active={option === preset}
                onClick={() => {
                  setPreset(option);
                  setAspect(null);
                }}
              >
                {t(SHARE_LABELS[option])}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="gap-1.5 flex flex-col">
          <legend className="mb-1 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.shareAspect')}
          </legend>
          <div className="gap-1.5 flex flex-wrap">
            {ASPECTS.map(({ value, labelKey, hintKey }) => (
              <Chip
                key={value}
                active={chosen === value}
                title={t(hintKey)}
                onClick={() => {
                  setAspect(value);
                }}
              >
                {t(labelKey)}
              </Chip>
            ))}
          </div>
        </fieldset>

        {/*
         * La vista previa **es** la imagen que se manda: se rasteriza la
         * lámina y se enseña ese mismo PNG, que además escala solo a cualquier
         * ancho. La lámina de verdad se pinta a tamaño real fuera de la vista
         * —es lo que se fotografía— y por eso está oculta a lectores de
         * pantalla.
         */}
        <div className="p-3 min-w-0 max-h-[46vh] overflow-y-auto rounded-lg border bg-muted/40">
          <p className="mb-2 text-xs text-muted-foreground">
            {image.failed ? t('calendar.shareFailed') : t('calendar.sharePreview')}
          </p>

          {image.url ? (
            <img src={image.url} alt="" className="rounded shadow-sm max-w-full" />
          ) : (
            <div className="h-40 animate-pulse rounded bg-muted" />
          )}
        </div>

        {/*
         * La lámina de verdad se pinta a tamaño real fuera de la vista —es lo
         * que se fotografía—. Va **absoluta dentro de una caja de 0×0 que
         * recorta**, y no fija: el diálogo se anima con `transform`, y eso lo
         * convierte en el bloque contenedor de lo fijo, así que la lámina
         * colgaba por debajo y dejaba un palmo de blanco al final del modal.
         */}
        <div aria-hidden className="h-0 w-0 relative overflow-hidden">
          <div className="top-0 left-0 absolute opacity-0">
            {data && (
              <Poster
                ref={poster}
                range={data}
                aspect={chosen}
                theme={theme}
                churchName={churchName}
                subtitle={soleName}
                title={title}
                month={anchor.slice(0, 7)}
                congregationName={nameOf}
                showCongregation={showCongregation}
              />
            )}
          </div>
        </div>

        <div className="gap-2 flex flex-wrap">
          {/*
           * Mandar también pregunta el formato: WhatsApp recomprime las
           * **imágenes** hasta que la letra pequeña deja de leerse, pero un
           * documento llega tal cual. Por eso el PDF está aquí y no escondido
           * en «Descargar».
           */}
          <MenuButton
            variant="primary"
            size="lg"
            icon={<Send size={16} aria-hidden />}
            label={t('calendar.shareSend')}
            options={[
              {
                id: 'image',
                label: t('calendar.shareAsImage'),
                hint: t('calendar.shareAsImageHint'),
                icon: <ImageIcon size={15} aria-hidden />,
                onSelect: () => void exporter.send(),
              },
              {
                id: 'pdf',
                label: t('calendar.shareAsPdf'),
                hint: t('calendar.shareAsPdfHint'),
                icon: <FileText size={15} aria-hidden />,
                onSelect: () => void exporter.pdf(),
              },
            ]}
          />

          {/*
           * Copiar y descargar son **dos acciones con dos formatos cada una**,
           * no cuatro botones: en fila ocupaban dos líneas y dejaban «Copiar
           * como texto» descolgado abajo, que es justo lo que no se leía.
           */}
          <MenuButton
            variant="secondary"
            icon={<Copy size={15} aria-hidden />}
            label={t('calendar.shareCopy')}
            options={[
              ...(exporter.canCopy
                ? [
                    {
                      id: 'image',
                      label: t('calendar.shareAsImage'),
                      hint: t('calendar.shareAsImageHint'),
                      icon: <ImageIcon size={15} aria-hidden />,
                      onSelect: () => void exporter.copy(),
                    },
                  ]
                : []),
              {
                id: 'text',
                label: t('calendar.shareAsText'),
                hint: t('calendar.shareAsTextHint'),
                icon: <Type size={15} aria-hidden />,
                onSelect: () => void exporter.copyAsText(),
              },
            ]}
          />

          <MenuButton
            icon={<Download size={15} aria-hidden />}
            label={t('calendar.shareDownload')}
            options={[
              {
                id: 'png',
                label: t('calendar.shareAsImage'),
                hint: t('calendar.shareAsImageHint'),
                icon: <ImageIcon size={15} aria-hidden />,
                onSelect: () => void exporter.download(),
              },
              {
                id: 'pdf',
                label: t('calendar.shareAsPdf'),
                hint: t('calendar.shareAsPdfHint'),
                icon: <FileText size={15} aria-hidden />,
                onSelect: () => void exporter.pdf(),
              },
            ]}
          />

          <Button variant="ghost" onClick={exporter.print}>
            <Printer size={15} aria-hidden />
            {t('calendar.sharePrint')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
