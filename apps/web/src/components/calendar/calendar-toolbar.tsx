import { ChevronLeft, ChevronRight, Share2, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ViewSwitch } from '@/components/calendar/view-switch';
import { Button } from '@/components/ui/button';
import { useDensityStore } from '@/lib/calendar/density';
import { monthTitle, rangeTitle } from '@/lib/calendar/labels';
import type { CalendarParams } from '@/lib/calendar/params';
import { cn } from '@/lib/cn';

/**
 * La barra de la pantalla: dónde estoy, cómo lo miro y qué me llevo.
 *
 * Programar **no** es un botón de aquí: se programa tocando la fase, que es
 * donde está la decisión. Aquí solo va lo que cambia el punto de vista.
 */
export function CalendarToolbar({
  params,
  onShare,
  canManage,
}: {
  params: CalendarParams;
  onShare: () => void;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const { density, setDensity } = useDensityStore();

  return (
    <div className="gap-3 flex flex-wrap items-center justify-between">
      <div className="gap-2 min-w-0 flex items-center">
        <div className="gap-0.5 flex items-center">
          <Arrow
            label={t('common.previous')}
            onClick={() => {
              params.step(-1);
            }}
          >
            <ChevronLeft size={18} aria-hidden />
          </Arrow>
          <Arrow
            label={t('common.next')}
            onClick={() => {
              params.step(1);
            }}
          >
            <ChevronRight size={18} aria-hidden />
          </Arrow>
        </div>

        <label className="group relative cursor-pointer">
          <span className="text-xl font-semibold tracking-tight sm:text-2xl">
            {params.custom
              ? rangeTitle(params.custom.from, params.custom.to)
              : monthTitle(params.anchor)}
          </span>
          <span className="sr-only">{t('calendar.jumpToDate')}</span>
          {/* El título es el selector de fecha: el `input` nativo abre el
              calendario del sistema, que en un móvil se maneja mejor que
              cualquier desplegable que pintemos nosotros. */}
          <input
            type="date"
            value={params.anchor}
            onChange={(event) => {
              if (event.target.value) params.setAnchor(event.target.value);
            }}
            className="inset-0 absolute cursor-pointer opacity-0"
          />
        </label>

        <Button variant="ghost" size="sm" onClick={params.goToday}>
          {t('calendar.today')}
        </Button>

        {params.custom && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              params.setCustom(null);
            }}
          >
            {t('calendar.clearRange')}
          </Button>
        )}
      </div>

      <div className="gap-2 flex flex-wrap items-center">
        <ViewSwitch view={params.view} onChange={params.setView} />

        <Button
          variant="ghost"
          size="sm"
          aria-pressed={density === 'compact'}
          title={t('calendar.density')}
          onClick={() => {
            setDensity(density === 'compact' ? 'cosy' : 'compact');
          }}
          className={cn('md:inline-flex hidden', density === 'compact' && 'text-foreground')}
        >
          <Settings2 size={15} aria-hidden />
          <span className="lg:not-sr-only sr-only">
            {t(density === 'compact' ? 'calendar.densityCompact' : 'calendar.densityCosy')}
          </span>
        </Button>

        {canManage && (
          <Link
            to="/calendar/settings"
            className="h-8 px-3 text-sm sm:inline-flex hidden items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t('calendar.settings')}
          </Link>
        )}

        <Button size="sm" onClick={onShare}>
          <Share2 size={15} aria-hidden />
          {t('calendar.share')}
        </Button>
      </div>
    </div>
  );
}

function Arrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-9 w-9 inline-flex cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
