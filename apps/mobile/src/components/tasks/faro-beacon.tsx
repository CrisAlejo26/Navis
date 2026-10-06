import Svg, { Path } from 'react-native-svg';
import { useTaskPalette } from './task-theme';
import { hexAlpha } from '@/lib/color';

/** Navis lighthouse, the same silhouette used by the calendar. */
export function FaroBeacon({ active, size = 44 }: { active: boolean; size?: number }) {
    const p = useTaskPalette(),
        color = active ? p.warning : p.mutedForeground;
    return (
        <Svg width={size} height={size} viewBox="0 0 42 44" accessibilityElementsHidden>
            <Path
                d="M17 17 L25 17 L28 40 L14 40 Z M16 12 L26 12 L26 18 L16 18 Z M15 12 L21 7 L27 12 Z"
                fill={hexAlpha(color, 0.18)}
                stroke={color}
                strokeWidth={1.5}
            />
            {active && (
                <Path d="M14 11 L3 5 L3 16 Z M28 11 L39 5 L39 16 Z" fill={hexAlpha(color, 0.3)} />
            )}
        </Svg>
    );
}
