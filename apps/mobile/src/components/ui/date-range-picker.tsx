import { addMonths, todayIn, type IsoDate } from '@navis/shared';
import { useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { DateRangePresets } from '@/components/ui/date-range-presets';
import { FieldButton } from '@/components/ui/field-button';
import { formatDay } from '@/lib/format';
import type { DateRange } from '@/lib/ui/date-grid';

export type { DateRange };

interface DateRangePickerProps {
  label: string;
  value: DateRange | null;
  placeholder: string;
  onChange: (value: DateRange) => void;
  disabled?: boolean;
  timezone?: string;
}

/**
 * Selector de un tramo de fechas — Fase 5 (Wise, TikTok): atajos arriba,
 * cuadrícula debajo. Primer toque marca el inicio; el segundo cierra el
 * tramo y confirma solo — sin un botón «Aplicar» aparte, como los atajos.
 */
export function DateRangePicker({
  label,
  value,
  placeholder,
  onChange,
  disabled = false,
  timezone = 'UTC',
}: DateRangePickerProps) {
  const today = todayIn(timezone);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value?.from ?? today);
  // `null` es «nada tocado todavía»; con solo `from` es el primer toque, a la
  // espera del segundo que cierre el tramo.
  const [draft, setDraft] = useState<{ from: IsoDate; to?: IsoDate } | null>(value);

  function openSheet() {
    setDraft(value);
    setMonth(value?.from ?? today);
    setOpen(true);
  }

  function commit(range: DateRange) {
    onChange(range);
    setOpen(false);
  }

  function selectDay(day: IsoDate) {
    if (draft && !draft.to && day >= draft.from) {
      commit({ from: draft.from, to: day });
      return;
    }
    // Ni hay tramo en marcha, ni el tramo ya estaba completo, ni el toque va
    // antes del inicio: en los tres casos, este toque empieza uno nuevo.
    setDraft({ from: day, to: undefined });
  }

  return (
    <>
      <FieldButton
        label={label}
        value={value ? `${formatDay(value.from)} – ${formatDay(value.to)}` : undefined}
        placeholder={placeholder}
        icon="calendar-outline"
        disabled={disabled}
        onPress={openSheet}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <DateRangePresets today={today} onSelect={commit} />
        <CalendarNav
          month={month}
          onPrevious={() => setMonth(addMonths(month, -1))}
          onNext={() => setMonth(addMonths(month, 1))}
        />
        <CalendarGrid
          month={month}
          today={today}
          isSelected={(day) => day === draft?.from || day === draft?.to}
          isInRange={(day) =>
            Boolean(draft?.to) && day > (draft?.from ?? '') && day < (draft?.to ?? '')
          }
          onSelectDay={selectDay}
        />
      </BottomSheet>
    </>
  );
}
