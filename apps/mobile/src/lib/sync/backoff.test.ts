import { ApiError } from '@navis/api-client';
import { ZodError } from 'zod';

import { retryDelayMs } from './backoff';
import { classifyError } from './classify-error';

describe('espera entre reintentos', () => {
    it('se duplica en cada intento, con variación entre el 50 % y el 100 %', () => {
        expect(retryDelayMs(0, () => 1)).toBe(5_000);
        expect(retryDelayMs(0, () => 0)).toBe(2_500);
        expect(retryDelayMs(1, () => 1)).toBe(10_000);
        expect(retryDelayMs(3, () => 1)).toBe(40_000);
    });

    it('nunca pasa de cinco minutos', () => {
        expect(retryDelayMs(30, () => 1)).toBe(300_000);
        expect(retryDelayMs(30, () => 0)).toBe(150_000);
    });

    it('con la aleatoriedad real queda siempre dentro de su horquilla', () => {
        for (let i = 0; i < 200; i += 1) {
            const delay = retryDelayMs(2);
            expect(delay).toBeGreaterThanOrEqual(10_000);
            expect(delay).toBeLessThanOrEqual(20_000);
        }
    });
});

describe('clasificación de errores', () => {
    it('distingue sin red, credencial, permiso, otra instalación y respuesta inválida', () => {
        expect(classifyError(ApiError.network())).toBe('offline');
        expect(classifyError(new TypeError('Network request failed'))).toBe('offline');
        expect(classifyError(new ApiError('caído', 503))).toBe('offline');
        expect(classifyError(new ApiError('no', 401))).toBe('needsAuth');
        expect(classifyError(new ApiError('no', 403))).toBe('forbidden');
        expect(classifyError(new ApiError('otra', 409))).toBe('rebase');
        expect(classifyError(new ApiError('mala', 400))).toBe('invalid');
        expect(classifyError(new ZodError([]))).toBe('invalid');
        expect(classifyError(new Error('raro'))).toBe('invalid');
    });
});
