import { describe, expect, it } from 'vitest';

import { operatorFor } from '@/lib/tables/filter-operator';

describe('el operador que le toca a cada tipo', () => {
    it('reparte igual que la API: contiene para texto, entre para número y fecha', () => {
        expect(operatorFor('text')).toBe('contains');
        expect(operatorFor('email')).toBe('contains');
        expect(operatorFor('number')).toBe('between');
        expect(operatorFor('currency')).toBe('between');
        expect(operatorFor('date')).toBe('between');
        expect(operatorFor('checkbox')).toBe('equals');
        expect(operatorFor('single_select')).toBe('in');
        expect(operatorFor('multi_select')).toBe('in');
    });

    it('la contraseña no se puede filtrar (D29)', () => {
        expect(operatorFor('password')).toBeUndefined();
    });
});
