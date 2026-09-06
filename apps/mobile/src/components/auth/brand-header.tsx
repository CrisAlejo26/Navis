import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChartLines } from '@/components/auth/chart-lines';

import navisIcon from '../../../assets/icon.png';

/**
 * La superficie de marca de las pantallas de acceso (Regla 9): el azul fijo
 * de la marca (`bg-brand`, que no cambia con el tema — Regla 7 §5) con las
 * curvas de nivel derivando por detrás, espejo de `BrandPanel`/`BrandStrip`
 * de la web. En móvil no hay punto de corte por ancho: siempre es la banda,
 * porque un teléfono nunca tiene la columna que sí cabe en escritorio.
 *
 * El barco sale del icono ya generado de la app (`assets/icon.png`, Regla 7):
 * ya trae su encuadre y su fondo azul resueltos, así que aquí solo hace falta
 * la insignia, sin montar una segunda tubería de recorte de logo para uno
 * solo de los cuatro clientes.
 */
export function BrandHeader({ tagline = true }: { tagline?: boolean }) {
  const { t } = useTranslation();

  return (
    <View className="px-6 pb-8 pt-16 relative overflow-hidden bg-brand">
      <ChartLines />

      <Animated.View
        entering={FadeInDown.duration(500).springify().damping(16)}
        className="gap-3 flex-row items-center"
      >
        <Image source={navisIcon} className="h-11 w-11 rounded-xl" />
        <Text className="text-xs font-semibold -mr-[0.1em] tracking-[6px] text-brand-foreground uppercase">
          {t('common.appName')}
        </Text>
      </Animated.View>

      {tagline && (
        <Animated.View
          entering={FadeInDown.delay(120).duration(500).springify().damping(16)}
          className="mt-6 gap-2"
        >
          <View className="w-10 h-px bg-accent" />
          <Text className="text-2xl font-semibold leading-tight text-brand-foreground">
            {t('auth.tagline')}
          </Text>
          {/* `/70` no es una clase de color válida en nativo (Regla 3 §5):
              la opacidad va como `style`, aparte del color. */}
          <Text className="text-sm leading-relaxed text-brand-foreground" style={{ opacity: 0.7 }}>
            {t('auth.taglineDetail')}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
