import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * La barra de pestañas ya ocupa espacio en el layout, no se suma al scroll.
 * Al usar este valor en contentContainerStyle, incluir ahí también el gap y
 * el padding: NativeWind 5 preview pierde contentContainerClassName cuando
 * se combina con un contentContainerStyle explícito.
 */
export function usePageBottomPadding(hasTabBar = false): number {
    const { bottom } = useSafeAreaInsets();
    return 16 + (hasTabBar ? 0 : bottom);
}
