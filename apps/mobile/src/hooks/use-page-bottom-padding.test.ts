import { renderHook } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePageBottomPadding } from './use-page-bottom-padding';

describe('margen inferior de páginas', () => {
    it('no vuelve a sumar el área segura que ya reserva la barra de pestañas', async () => {
        const insets = jest.mocked(useSafeAreaInsets);
        insets.mockReturnValue({ top: 24, bottom: 32, left: 0, right: 0 });
        const { result } = await renderHook(() => usePageBottomPadding(true));
        expect(result.current).toBe(16);
        insets.mockReset();
    });

    it('protege el contenido sobre la zona de gestos en pantallas sin pestañas', async () => {
        const insets = jest.mocked(useSafeAreaInsets);
        insets.mockReturnValue({ top: 24, bottom: 32, left: 0, right: 0 });
        const { result } = await renderHook(() => usePageBottomPadding());
        expect(result.current).toBe(48);
        insets.mockReset();
    });
});
