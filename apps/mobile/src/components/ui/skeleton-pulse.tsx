import { createContext, useContext, useEffect, type ReactNode } from 'react';
import {
    cancelAnimation,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';

const SkeletonPulseContext = createContext<SharedValue<number> | null>(null);

/** Share one animation across a loading region, including nested groups. */
export function useSkeletonPulse() {
    const inherited = useContext(SkeletonPulseContext);
    const reduced = useReducedMotion();
    const opacity = useSharedValue(1);
    useEffect(() => {
        if (inherited) return;
        opacity.value = reduced ? 0.6 : withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
        return () => cancelAnimation(opacity);
    }, [inherited, reduced, opacity]);
    return inherited ?? opacity;
}

export function SkeletonGroup({ children }: { children: ReactNode }) {
    const opacity = useSkeletonPulse();
    return (
        <SkeletonPulseContext.Provider value={opacity}>{children}</SkeletonPulseContext.Provider>
    );
}
