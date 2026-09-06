import type { IsoDate } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';
import { buildDateGrid } from '@/lib/ui/date-grid';

interface CalendarNavProps {
  month: IsoDate;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Cabecera de mes con navegación — compartida por `DatePicker` y
 * `DateRangePicker` (Fase 5): los dos la necesitaban igual, así que sale de
 * los dos ficheros en vez de repetirse (Regla 1 §5).
 */
export function CalendarNav({ month, onPrevious, onNext }: CalendarNavProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between">
      <IconButton
        icon="chevron-back"
        accessibilityLabel={t('common.previousMonth')}
        onPress={onPrevious}
      />
      <Title size="md">{buildDateGrid(month).monthLabel}</Title>
      <IconButton
        icon="chevron-forward"
        accessibilityLabel={t('common.nextMonth')}
        onPress={onNext}
      />
    </View>
  );
}
