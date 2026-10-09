import { hasRoomToDownload, MIN_FREE_BYTES, shouldDeferForBattery } from './resources';

describe('recursos del teléfono', () => {
    it('baja solo si queda espacio de sobra', () => {
        expect(hasRoomToDownload(MIN_FREE_BYTES)).toBe(true);
        expect(hasRoomToDownload(MIN_FREE_BYTES - 1)).toBe(false);
    });

    it('aplaza lo automático con batería baja, pero no lo que pide la persona ni cargando', () => {
        expect(shouldDeferForBattery(0.1, false, false)).toBe(true);
        expect(shouldDeferForBattery(0.1, false, true)).toBe(false);
        expect(shouldDeferForBattery(0.1, true, false)).toBe(false);
        expect(shouldDeferForBattery(0.5, false, false)).toBe(false);
    });

    it('un nivel de batería desconocido no frena nada', () => {
        expect(shouldDeferForBattery(-1, false, false)).toBe(false);
    });
});
