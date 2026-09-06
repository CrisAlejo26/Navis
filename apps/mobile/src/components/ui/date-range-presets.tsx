import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, type IsoDate } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import type { DateRange } from '@/lib/ui/date-grid';

interface DateRangePresetsProps {
  today: IsoDate;
  onSelect: (range: DateRange) => void;
}

/** Los atajos de Wise/TikTok (Fase 5): un toque fija el tramo entero. */
export function DateRangePresets({ today, onSelect }: DateRangePresetsProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-2 flex-row">
      <Button
        title={t('common.today')}
        variant="outline"
        size="sm"
        onPress={() => onSelect({ from: today, to: today })}
      />
      <Button
        title={t('common.thisWeek')}
        variant="outline"
        size="sm"
        onPress={() => onSelect({ from: startOfWeek(today), to: endOfWeek(today) })}
      />
      <Button
        title={t('common.thisMonth')}
        variant="outline"
        size="sm"
        onPress={() => onSelect({ from: startOfMonth(today), to: endOfMonth(today) })}
      />
    </View>
  );
}
