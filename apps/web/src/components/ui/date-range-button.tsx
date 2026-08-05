import { addDays, todayIn, type IsoDate } from '@navis/shared';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDay, formatDayRange } from '@/lib/format';
import { toast } from '@/lib/toast';

/**
 * Los tramos rápidos. Solo ponen el «desde»: «los últimos 30 días» no tiene
 * final, y poner hoy como tope dejaría fuera lo que se apunte esta noche.
 */
const ATAJOS = [
  { labelKey: 'common.last7Days', from: (hoy: IsoDate) => addDays(hoy, -7) },
  { labelKey: 'common.last30Days', from: (hoy: IsoDate) => addDays(hoy, -30) },
  { labelKey: 'common.thisYear', from: (hoy: IsoDate) => `${hoy.slice(0, 4)}-01-01` },
] as const;

/**
 * El tramo de fechas a medida, en un botón junto a la acción principal.
 *
 * Vivía dentro del panel de filtros, con los dos campos siempre a la vista.
 * Aquí ocupa un botón, y eso hace dos cosas: deja el panel para lo que se pulsa
 * a menudo —estados y emociones— y convierte elegir un tramo en **una decisión
 * con su momento**, que es lo que es.
 *
 * El botón dice el tramo cuando lo hay, en vez de un rótulo fijo: un filtro
 * puesto que no se ve es la forma más rápida de no entender un listado vacío.
 */
export function DateRangeButton({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from, to });
  const hoy = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const activo = Boolean(from || to);
  // El rótulo dice el tramo con palabras, no dos fechas cortas pegadas: «5/8/26
  // – 12/8/26» se lee como un número de serie (Regla 9 §6).
  const rotulo = !activo
    ? t('common.dateRange')
    : from && to
      ? formatDayRange(from, to)
      : from
        ? `${t('common.dateFrom')} ${formatDay(from)}`
        : `${t('common.dateTo')} ${formatDay(to)}`;

  const abrir = () => {
    // El borrador nace del filtro puesto: abrir y cerrar sin tocar nada no
    // puede cambiar lo que había.
    setDraft({ from, to });
    setOpen(true);
  };

  return (
    <>
      <Button variant={activo ? 'secondary' : 'ghost'} size="lg" onClick={abrir}>
        <CalendarRange size={17} aria-hidden />
        {rotulo}
      </Button>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        width="min(26rem, calc(100vw - 2rem))"
        title={t('common.dateRange')}
      >
        <div className="gap-4 flex flex-col">
          {/* Los tramos de siempre, antes de los dos campos: el 90 % de las
              veces se busca «lo de esta semana» y no una fecha concreta. */}
          <div className="gap-1.5 flex flex-wrap" role="group" aria-label={t('common.dateRange')}>
            {ATAJOS.map((atajo) => {
              const rango = { from: atajo.from(hoy), to: '' };
              return (
                <Chip
                  key={atajo.labelKey}
                  active={draft.from === rango.from && draft.to === ''}
                  onClick={() => {
                    setDraft(rango);
                  }}
                >
                  {t(atajo.labelKey)}
                </Chip>
              );
            })}
          </div>

          <div className="gap-3 sm:grid-cols-2 grid">
            <Input
              type="date"
              value={draft.from}
              label={t('common.dateFrom')}
              // El «hasta» acota al «desde» y al revés: un tramo invertido no
              // devuelve nada, y el navegador lo dice antes de que pase.
              max={draft.to || undefined}
              onChange={(event) => {
                setDraft((previous) => ({ ...previous, from: event.target.value }));
              }}
            />
            <Input
              type="date"
              value={draft.to}
              label={t('common.dateTo')}
              min={draft.from || undefined}
              onChange={(event) => {
                setDraft((previous) => ({ ...previous, to: event.target.value }));
              }}
            />
          </div>

          <div className="gap-2 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                onChange({ from: '', to: '' });
                toast.success(t('common.filterCleared'));
                setOpen(false);
              }}
            >
              {t('common.delete')}
            </Button>
            <Button
              onClick={() => {
                onChange(draft);
                toast.success(t('common.filterApplied'));
                setOpen(false);
              }}
            >
              {t('common.apply')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
