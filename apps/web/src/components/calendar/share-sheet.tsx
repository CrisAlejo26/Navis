import { useCalendar } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { Copy, Download, Printer, Send, Type } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Poster } from '@/components/calendar/poster';
import { type PosterAspect } from '@/components/calendar/poster-size';
import { usePosterExport } from '@/components/calendar/use-poster-export';
import { usePosterImage } from '@/components/calendar/use-poster-image';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
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
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          <Chip
            active={chosen === 'portrait'}
            onClick={() => {
              setAspect('portrait');
            }}
          >
            {t('calendar.sharePortrait')}
          </Chip>
          <Chip
            active={chosen === 'landscape'}
            onClick={() => {
              setAspect('landscape');
            }}
          >
            {t('calendar.shareLandscape')}
          </Chip>
        </div>

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

        <div aria-hidden className="top-0 fixed -left-[9999px] opacity-0">
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

        <div className="gap-2 flex flex-wrap">
          <Button size="lg" isLoading={exporter.busy} onClick={() => void exporter.send()}>
            <Send size={16} aria-hidden />
            {t('calendar.shareSend')}
          </Button>

          {exporter.canCopy && (
            <Button variant="secondary" onClick={() => void exporter.copy()}>
              <Copy size={15} aria-hidden />
              {t('calendar.shareCopyImage')}
            </Button>
          )}

          <Button variant="ghost" onClick={() => void exporter.download()}>
            <Download size={15} aria-hidden />
            {t('calendar.shareDownload')}
          </Button>

          <Button variant="ghost" onClick={exporter.print}>
            <Printer size={15} aria-hidden />
            {t('calendar.sharePrint')}
          </Button>

          <Button variant="ghost" onClick={() => void exporter.copyAsText()}>
            <Type size={15} aria-hidden />
            {t('calendar.shareCopyText')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-8 px-3 text-xs font-medium cursor-pointer rounded-full border',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active
          ? 'border-foreground/25 bg-foreground/8 text-foreground'
          : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
