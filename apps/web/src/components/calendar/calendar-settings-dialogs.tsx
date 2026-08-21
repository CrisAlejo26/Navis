import type { Calendar, Congregation, MeetingPattern } from '@navis/shared';

import { CalendarForm } from '@/components/calendar/calendar-form';
import { CongregationForm } from '@/components/calendar/congregation-form';
import { DeleteCalendarDialog } from '@/components/calendar/delete-calendar-dialog';
import { DeleteCongregationDialog } from '@/components/calendar/delete-congregation-dialog';
import { DeletePatternDialog } from '@/components/calendar/delete-pattern-dialog';
import { PatternForm, type PatternDefaults } from '@/components/calendar/pattern-form';

/** Qué está abierto en los ajustes de un calendario, y con qué dato. */
export interface CalendarSettingsDialogsState {
  calendar: Calendar | undefined;
  congregations: readonly Congregation[];
  renaming: boolean;
  setRenaming: (value: boolean) => void;
  congregation: Congregation | null;
  addCongregation: boolean;
  setCongregation: (value: Congregation | null) => void;
  setAddCongregation: (value: boolean) => void;
  pattern: MeetingPattern | null;
  setPattern: (value: MeetingPattern | null) => void;
  creating: boolean;
  setCreating: (value: boolean) => void;
  abrirDesdePlantilla: boolean;
  patternDefaults: PatternDefaults | undefined;
  limpiarPlantilla: () => void;
  borrarCalendario: boolean;
  setBorrarCalendario: (value: boolean) => void;
  borrarSede: Congregation | null;
  setBorrarSede: (value: Congregation | null) => void;
  borrarPatron: MeetingPattern | null;
  setBorrarPatron: (value: MeetingPattern | null) => void;
  onCalendarDeleted: () => void;
}

/**
 * Los seis diálogos de la ficha de ajustes de un calendario, agrupados aparte
 * para que `calendar-settings.tsx` se quede en el objetivo de la Regla 6.
 */
export function CalendarSettingsDialogs({ state }: { state: CalendarSettingsDialogsState }) {
  const {
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
    onCalendarDeleted,
  } = state;

  return (
    <>
      <DeleteCalendarDialog
        calendar={borrarCalendario ? (calendar ?? null) : null}
        onClose={() => {
          setBorrarCalendario(false);
        }}
        onDeleted={onCalendarDeleted}
      />

      <DeleteCongregationDialog
        congregation={borrarSede}
        onClose={() => {
          setBorrarSede(null);
        }}
      />

      <DeletePatternDialog
        pattern={borrarPatron}
        calendarId={calendar?.id ?? ''}
        onClose={() => {
          setBorrarPatron(null);
        }}
      />

      <CongregationForm
        open={addCongregation || Boolean(congregation)}
        congregation={congregation ?? undefined}
        onClose={() => {
          setAddCongregation(false);
          setCongregation(null);
        }}
      />

      {renaming && calendar && (
        <CalendarForm
          open
          calendar={calendar}
          onClose={() => {
            setRenaming(false);
          }}
        />
      )}

      {(creating || pattern || abrirDesdePlantilla) && (
        <PatternForm
          open
          congregations={congregations}
          calendarId={calendar?.id ?? ''}
          pattern={pattern ?? undefined}
          defaults={pattern ? undefined : patternDefaults}
          onClose={() => {
            setCreating(false);
            setPattern(null);
            limpiarPlantilla();
          }}
        />
      )}
    </>
  );
}
