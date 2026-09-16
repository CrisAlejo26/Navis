import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Hoja inferior genérica — Fase 5. Sale de aquí porque `Select`, `DatePicker`
 * y `DateRangePicker` la necesitan los tres; la Fase 13 la reutiliza para lo
 * suyo en vez de montar otra (Regla 1 §5: a la segunda vez ya se comparte).
 *
 * La entrada es un fundido con desplazamiento (`FadeInDown`, 120 ms) y la
 * salida la cierra el propio modal con su fundido — suave, como WhatsApp.
 * La hoja va clavada con `absolute bottom-0` y no con `justify-end`: en el
 * emulador el `justify-end` la dejaba flotando sobre la barra inferior con
 * un corte visible del fondo atenuado, y el anclaje absoluto no deja hueco.
 *
 * El fondo se atenúa poco (35%) — como WhatsApp, detrás sigue viéndose lo
 * que se estaba haciendo — y los dos translúcidos hacen que el oscurecido
 * cubra también la barra de estado y la de gestos.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1">
        <Pressable
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="inset-0 bg-black absolute opacity-35"
        />
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(120).springify().damping(30)}
          className="inset-x-0 bottom-0 gap-3 px-4 pt-4 rounded-t-3xl absolute bg-card"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {title ? (
            <View className="flex-row items-center justify-between">
              <Title size="md">{title}</Title>
              <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
