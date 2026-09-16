import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useRef } from 'react';
import { Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import type { IoniconName } from '@/lib/nav-mobile';

/** Una acción de gesto: fondo tintado, icono y etiqueta en su color de frente. */
export interface SwipeAction {
  icon: IoniconName;
  label: string;
  /** Fondo de la acción: un token de la paleta, nunca un hex suelto (Regla 3). */
  color: string;
  /** Color del icono y del texto sobre ese fondo (p. ej. `successForeground`). */
  foreground: string;
  onAction: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  /** En modo selección el gesto se apaga: la casilla manda. */
  disabled?: boolean;
  /** Acción que se revela deslizando la tarjeta hacia la derecha. */
  left?: SwipeAction;
  /** Acción que se revela deslizando hacia la izquierda. */
  right?: SwipeAction;
}

/**
 * La acción revelada: fondo tintado a todo lo ancho, icono y etiqueta en su
 * color de frente. `alFinal` pone el icono al final del texto — el gesto
 * izquierdo abre hacia la izquierda y el icono cierra el gesto por el lado
 * que el dedo recorre.
 */
function AccionDeGesto({ accion, alFinal }: { accion: SwipeAction; alFinal: boolean }) {
  return (
    <View
      className="rounded-2xl flex-1 flex-row items-center justify-end"
      style={{ backgroundColor: accion.color, paddingLeft: 24, paddingRight: 24 }}
    >
      {alFinal ? null : (
        <Ionicons name={accion.icon} size={18} color={accion.foreground} aria-hidden />
      )}
      <Text className="font-sans-semibold text-[13px]" style={{ color: accion.foreground }}>
        {accion.label}
      </Text>
      {alFinal ? (
        <Ionicons name={accion.icon} size={18} color={accion.foreground} aria-hidden />
      ) : null}
    </View>
  );
}

/**
 * Una fila con gestos, como las tarjetas de taskia (que es de donde viene el
 * mecanismo): arrastrar descubre la acción de su lado y al pasar el umbral
 * se ejecuta y la fila se cierra en el mismo tick. Sin overshoot: si se
 * pasa, es porque el dedo quiso.
 */
export function SwipeableRow({ children, disabled = false, left, right }: SwipeableRowProps) {
  const ref = useRef<Swipeable>(null);

  if (disabled || (!left && !right)) return <>{children}</>;

  return (
    <View className="rounded-2xl overflow-hidden">
      <Swipeable
        ref={ref}
        friction={2}
        leftThreshold={72}
        rightThreshold={72}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={left ? () => <AccionDeGesto accion={left} alFinal={false} /> : undefined}
        renderRightActions={right ? () => <AccionDeGesto accion={right} alFinal /> : undefined}
        onSwipeableOpen={(direction) => {
          ref.current?.close();
          if (direction === 'left') left?.onAction();
          else right?.onAction();
        }}
      >
        {children}
      </Swipeable>
    </View>
  );
}
