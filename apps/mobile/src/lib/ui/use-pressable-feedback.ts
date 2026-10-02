import { useState } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

/** NativeWind receives concrete styles; consumers retain the full Pressable state. */
export function usePressableFeedback(
    props: Pick<PressableProps, 'style' | 'onPressIn' | 'onPressOut' | 'onHoverIn' | 'onHoverOut'>,
    base: (pressed: boolean) => StyleProp<ViewStyle>,
) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    return {
        style: [
            base(pressed),
            typeof props.style === 'function' ? props.style({ pressed, hovered }) : props.style,
        ],
        onPressIn: ((event) => {
            setPressed(true);
            props.onPressIn?.(event);
        }) as PressableProps['onPressIn'],
        onPressOut: ((event) => {
            setPressed(false);
            props.onPressOut?.(event);
        }) as PressableProps['onPressOut'],
        onHoverIn: ((event) => {
            setHovered(true);
            props.onHoverIn?.(event);
        }) as PressableProps['onHoverIn'],
        onHoverOut: ((event) => {
            setHovered(false);
            props.onHoverOut?.(event);
        }) as PressableProps['onHoverOut'],
    };
}
