import { todayIn, type IsoDate } from '@navis/shared';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';

interface ProphecyFulfillmentToggleProps {
  fulfilledAt: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
}

/**
 * El interruptor «Ya se cumplió» (D6): al encenderlo despliega el selector de
 * fecha con hoy puesto, y al apagarlo lo limpia — con la misma animación de
 * entrada/salida que Dreamkeeper usa para el mismo gesto (§2.2, RFC 0004
 * §7.8), apagada con `useReducedMotion`.
 */
export function ProphecyFulfillmentToggle({
  fulfilledAt,
  onChange,
}: ProphecyFulfillmentToggleProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const on = fulfilledAt !== null;

  return (
    <View className="gap-2">
      <Switch
        label={t('prophecies.markFulfilled')}
        description={t('prophecies.markFulfilledHint')}
        checked={on}
        onChange={(checked) => onChange(checked ? todayIn('UTC') : null)}
        tone="success"
      />
      {on ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(220)}
          exiting={reducedMotion ? undefined : FadeOut.duration(180)}
        >
          <DatePicker
            label={t('prophecies.fulfilledAt')}
            value={fulfilledAt}
            placeholder={t('prophecies.fulfilledAt')}
            onChange={onChange}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
