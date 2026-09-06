import { addMonths, todayIn, type IsoDate } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { FieldButton } from '@/components/ui/field-button';
import { formatDay } from '@/lib/format';

interface DatePickerProps {
  label: string;
  value: IsoDate | null;
  placeholder: string;
  error?: string;
  onChange: (value: IsoDate) => void;
  disabled?: boolean;
  timezone?: string;
}

/** Selector de un día — Fase 5: hoja inferior con cuadrícula de mes. */
export function DatePicker({
  label,
  value,
  placeholder,
  error,
  onChange,
  disabled = false,
  timezone = 'UTC',
}: DatePickerProps) {
  const { t } = useTranslation();
  const today = todayIn(timezone);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value ?? today);

  function openSheet() {
    setMonth(value ?? today);
    setOpen(true);
  }

  function selectToday() {
    onChange(today);
    setOpen(false);
  }

  return (
    <>
      <FieldButton
        label={label}
        value={value ? formatDay(value) : undefined}
        placeholder={placeholder}
        icon="calendar-outline"
        error={error}
        disabled={disabled}
        onPress={openSheet}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <CalendarNav
          month={month}
          onPrevious={() => setMonth(addMonths(month, -1))}
          onNext={() => setMonth(addMonths(month, 1))}
        />
        <CalendarGrid
          month={month}
          today={today}
          isSelected={(day) => day === value}
          onSelectDay={(day) => {
            onChange(day);
            setOpen(false);
          }}
        />
        <Button title={t('common.today')} variant="link" onPress={selectToday} />
      </BottomSheet>
    </>
  );
}
