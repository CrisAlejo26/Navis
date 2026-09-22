import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
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
 *
 * El formulario vive en `KeyboardAvoidingView` + `ScrollView` (Regla 5 §5):
 * el `<Modal>` abre su **propia ventana nativa** y el `adjustResize` de la
 * Activity no le llega — con `statusBarTranslucent` y
 * `navigationBarTranslucent` menos —, así que sin él el campo enfocado
 * queda tapado por el teclado y no se ve lo que se escribe. El
 * `behavior="padding"` va explícito **en los dos sistemas**: en una pantalla
 * normal Android redimensiona solo y en iOS basta el padding, pero aquí
 * ninguno lo tiene gratis (CLAUDE.md, «BottomSheet y teclado»). El `ScrollView`
 * lleva el límite de alto — la hoja no puede crecer más que la pantalla
 * menos el aire superior — para que un formulario largo haga scroll en vez
 * de salirse, y `keyboardShouldPersistTaps` para que los toques sobre los
 * campos y el botón no se los coma el cierre del teclado.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();

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
          <KeyboardAvoidingView behavior="padding" style={{ maxHeight: height - 96 }}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
