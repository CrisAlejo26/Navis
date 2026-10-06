import { useMemo, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
export function useTaskOrderDrag(start: () => void, drop: (pageY: number) => void, cancel: () => void, disabled: boolean) {
    const [offset, setOffset] = useState(0), held = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbacks = useRef({ start, drop, cancel, disabled });
    callbacks.current = { start, drop, cancel, disabled };
    const responder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => !callbacks.current.disabled,
        onPanResponderGrant: () => { timer.current = setTimeout(() => { held.current = true; callbacks.current.start(); }, 250); },
        onPanResponderMove: (_, gesture) => { if (held.current) setOffset(gesture.dy); else if (Math.abs(gesture.dy) > 8 && timer.current) clearTimeout(timer.current); },
        onPanResponderRelease: (_, gesture) => { if (timer.current) clearTimeout(timer.current); if (held.current) callbacks.current.drop(gesture.moveY || gesture.y0); held.current = false; setOffset(0); },
        onPanResponderTerminate: () => { if (timer.current) clearTimeout(timer.current); held.current = false; setOffset(0); callbacks.current.cancel(); },
        onPanResponderTerminationRequest: () => !held.current,
    }), []);
    return { handlers: responder.panHandlers, offset };
}
