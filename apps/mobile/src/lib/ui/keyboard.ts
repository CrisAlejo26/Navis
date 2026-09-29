import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

/**
 * Cuánto tapa el teclado, en puntos (0 con el teclado cerrado). Se escucha el
 * evento del propio teclado en vez de fiarse de `KeyboardAvoidingView`: dentro
 * de un `<Modal>` —otra ventana nativa— el redimensionado automático no llega
 * y `KeyboardAvoidingView` calcula mal su marco, así que el campo enfocado
 * quedaba tapado (CLAUDE.md, «BottomSheet y teclado»).
 */
export function useKeyboardHeight(): number {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const shown = Keyboard.addListener(show, (event) => setHeight(event.endCoordinates.height));
        const hidden = Keyboard.addListener(hide, () => setHeight(0));
        return () => {
            shown.remove();
            hidden.remove();
        };
    }, []);

    return height;
}

/**
 * El alto máximo del cuerpo desplazable de una hoja: una fracción de la
 * pantalla **que queda libre** con el teclado abierto. Con la fracción de la
 * pantalla entera, el cuerpo no cabía sobre el teclado y el campo quedaba
 * debajo.
 */
export function useSheetBodyMaxHeight(fraction: number): number {
    const { height } = useWindowDimensions();
    return Math.max(140, (height - useKeyboardHeight()) * fraction);
}
