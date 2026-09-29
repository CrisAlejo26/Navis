import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';
import { useKeyboardHeight } from '@/lib/ui/keyboard';

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
 * El teclado se sigue con sus propios eventos (`useKeyboardHeight`): el
 * `<Modal>` abre su **propia ventana nativa**, el `adjustResize` de la Activity
 * no le llega —con `statusBarTranslucent` y `navigationBarTranslucent` menos— y
 * `KeyboardAvoidingView` calculaba mal su marco dentro de ella, así que el campo
 * enfocado quedaba tapado. La hoja se apoya en el teclado (`bottom`) y su cuerpo
 * desplazable se limita a lo que queda libre. Las hojas con un `ScrollView`
 * propio piden su alto a `useSheetBodyMaxHeight`, nunca a una fracción de la
 * pantalla entera (CLAUDE.md, «BottomSheet y teclado»). `keyboardShouldPersistTaps`
 * evita que el cierre del teclado se coma los toques sobre campos y botón.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();
    const { height } = useWindowDimensions();
    const keyboard = useKeyboardHeight();

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
                    entering={
                        reducedMotion ? undefined : FadeInDown.duration(120).springify().damping(30)
                    }
                    className="inset-x-0 bottom-0 gap-3 px-4 pt-4 rounded-t-3xl absolute bg-card"
                    // Con el teclado abierto la hoja se apoya en él, no en el borde de la
                    // pantalla, y ya no hay barra de gestos debajo.
                    style={{
                        bottom: keyboard,
                        paddingBottom: keyboard > 0 ? 16 : insets.bottom + 16,
                    }}
                >
                    {title ? (
                        <View className="flex-row items-center justify-between">
                            <Title size="md">{title}</Title>
                            <IconButton
                                icon="close"
                                accessibilityLabel={t('common.close')}
                                onPress={onClose}
                            />
                        </View>
                    ) : null}
                    <ScrollView
                        style={{ maxHeight: height - keyboard - 96 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}
