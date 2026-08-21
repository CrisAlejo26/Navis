import { useCongregations, usePatterns } from '@navis/api-client';
import type { Congregation, MeetingPattern } from '@navis/shared';
import { CalendarClock, ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { CalendarSettingsDialogs } from '@/components/calendar/calendar-settings-dialogs';
import { CongregationRows } from '@/components/calendar/congregation-rows';
import type { PatternDefaults } from '@/components/calendar/pattern-form';
import { PatternRows } from '@/components/calendar/pattern-rows';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { useActiveCalendar } from '@/lib/calendar/use-active-calendar';

/**
 * Lo que hay detrás de **un** calendario: sus reuniones fijas, su nombre y las
 * sedes de la iglesia —que son de todos los calendarios (D17)—.
 *
 * Se configura una vez y el mes se llena solo a partir de ahí; por eso no está
 * en la pantalla principal, donde estorbaría todos los días.
 */
export function CalendarSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { calendar, calendars } = useActiveCalendar();
  const { data: congregations = [] } = useCongregations(api);
  const { data: patterns = [] } = usePatterns(api, calendar?.id ?? '');

  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [addCongregation, setAddCongregation] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pattern, setPattern] = useState<MeetingPattern | null>(null);
  const [creating, setCreating] = useState(false);
  const [borrarCalendario, setBorrarCalendario] = useState(false);
  const [borrarSede, setBorrarSede] = useState<Congregation | null>(null);
  const [borrarPatron, setBorrarPatron] = useState<MeetingPattern | null>(null);

  /**
   * Al llegar desde una plantilla de calendario, `CalendarForm` deja la
   * sugerencia de reunión en el estado de la navegación (`state`, no la URL:
   * es un objeto, no un texto que compartir). Se deriva en el propio render
   * —sin `useEffect`, que aquí dispararía un `setState` en cascada— y solo
   * cuenta si ya hay una sede que proponer: sin eso, `PatternForm` no tiene
   * qué poner en el desplegable.
   */
  const patternDefaults = (location.state as { patternDefaults?: PatternDefaults } | null)
    ?.patternDefaults;
  const abrirDesdePlantilla = Boolean(patternDefaults) && congregations.length > 0;
  const limpiarPlantilla = () => {
    if (patternDefaults) void navigate(location.pathname, { replace: true, state: null });
  };

  const volver = `/calendar/${calendar?.slug ?? ''}`;

  return (
    <section className="max-w-2xl gap-6 flex flex-col">
      <div className="gap-3 flex items-center">
        <Link
          to={volver}
          aria-label={t('common.back')}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold">{calendar?.name ?? t('calendar.settings')}</h1>

        <div className="gap-1 ml-auto flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRenaming(true);
            }}
          >
            <Pencil size={15} aria-hidden />
            {t('calendar.renameCalendar')}
          </Button>

          {calendars.length > 1 && calendar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBorrarCalendario(true);
              }}
            >
              <Trash2 size={15} aria-hidden />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="gap-3 mb-2 flex items-center justify-between">
          <CardTitle className="text-base">{t('calendar.patterns')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              limpiarPlantilla();
              setCreating(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('calendar.addPattern')}
          </Button>
        </div>

        {patterns.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t('calendar.empty')}>
            {t('calendar.emptyHint')}
          </EmptyState>
        ) : (
          <PatternRows
            patterns={patterns}
            congregations={congregations}
            onEdit={setPattern}
            onDelete={setBorrarPatron}
          />
        )}
      </Card>

      <Card>
        <div className="gap-3 mb-2 flex items-center justify-between">
          <CardTitle className="text-base">{t('calendar.congregations')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAddCongregation(true);
            }}
          >
            <Plus size={15} aria-hidden />
            {t('calendar.addCongregation')}
          </Button>
        </div>

        <p className="mb-2 text-sm text-muted-foreground">{t('calendar.congregationsHint')}</p>
        <CongregationRows
          congregations={congregations}
          onEdit={setCongregation}
          onDelete={setBorrarSede}
        />
      </Card>

      <CalendarSettingsDialogs
        state={{
          calendar,
          congregations,
          renaming,
          setRenaming,
          congregation,
          addCongregation,
          setCongregation,
          setAddCongregation,
          pattern,
          setPattern,
          creating,
          setCreating,
          abrirDesdePlantilla,
          patternDefaults,
          limpiarPlantilla,
          borrarCalendario,
          setBorrarCalendario,
          borrarSede,
          setBorrarSede,
          borrarPatron,
          setBorrarPatron,
          onCalendarDeleted: () => {
            void navigate('/calendar');
          },
        }}
      />
    </section>
  );
}
