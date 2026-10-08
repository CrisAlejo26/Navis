import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';

/** Pulsación larga (250 ms) y arrastre vertical; `lifted` deja pintar la fila «en la mano». */
export function useTaskOrderDrag(
    start: () => void,
    drop: (pageY: number) => void,
    cancel: () => void,
    disabled: boolean,
) {
    const [offset, setOffset] = useState(0),
        [lifted, setLifted] = useState(false),
        held = useRef(false),
        timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbacks = useRef({ start, drop, cancel, disabled });
    useEffect(() => {
        callbacks.current = { start, drop, cancel, disabled };
    });
    const release = () => {
        if (timer.current) clearTimeout(timer.current);
        held.current = false;
        setLifted(false);
        setOffset(0);
    };
    // Los refs solo se leen dentro de los gestos, nunca al renderizar; el compilador de React no lo distingue.
    // eslint-disable-next-line react-hooks/refs
    const [responder] = useState(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => !callbacks.current.disabled,
            onPanResponderGrant: () => {
                timer.current = setTimeout(() => {
                    held.current = true;
                    setLifted(true);
                    callbacks.current.start();
                }, 250);
            },
            onPanResponderMove: (_, gesture) => {
                if (held.current) setOffset(gesture.dy);
                else if (Math.abs(gesture.dy) > 8 && timer.current) clearTimeout(timer.current);
            },
            onPanResponderRelease: (_, gesture) => {
                const wasHeld = held.current;
                release();
                if (wasHeld) callbacks.current.drop(gesture.moveY || gesture.y0);
            },
            onPanResponderTerminate: () => {
                release();
                callbacks.current.cancel();
            },
            onPanResponderTerminationRequest: () => !held.current,
        }),
    );
    return { handlers: responder.panHandlers, offset, lifted };
}
