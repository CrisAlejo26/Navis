import type { ViewStyle } from 'react-native';

import { hexAlpha } from '@/lib/color';

/** Color follows the action's semantic token in both themes. */
export function settingsButtonEffect(color: string, pressed: boolean): ViewStyle {
    return {
        boxShadow: `0px ${pressed ? 2 : 5}px ${pressed ? 6 : 14}px ${hexAlpha(color, pressed ? 0.12 : 0.22)}`,
        transform: [{ translateY: pressed ? 1 : 0 }],
    };
}
