import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ChartLines } from '@/components/auth/chart-lines';

import navisIcon from '../../../assets/icon.png';

/**
 * El primer instante tras el splash nativo (que es estático: una imagen y un
 * color, sin animación posible — Regla 3 §4). Este es el puente animado hasta
 * saber si hay sesión, con el mismo lenguaje de marca que `BrandHeader`: nada
 * de un spinner suelto sobre blanco.
 *
 * Sin retraso artificial: dura lo que tarde `useSession()`, que ya es breve
 * (Regla 9 §5, «la animación confirma la acción, no disimula lentitud»).
 */
export function BrandSplash() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-brand">
      <ChartLines height={400} />

      <Animated.View entering={ZoomIn.duration(420).springify().damping(14)}>
        <Image source={navisIcon} className="h-20 w-20 rounded-3xl" />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(160).duration(400)}>
        <Text className="mt-4 text-xs font-semibold tracking-[6px] text-brand-foreground uppercase">
          {t('common.appName')}
        </Text>
      </Animated.View>
    </View>
  );
}
