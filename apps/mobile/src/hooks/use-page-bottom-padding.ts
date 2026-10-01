import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** La barra de pestañas ya ocupa espacio en el layout, no se suma al scroll. */
export function usePageBottomPadding(hasTabBar = false): number {
    const { bottom } = useSafeAreaInsets();
    return 16 + (hasTabBar ? 0 : bottom);
}
