import { render, screen } from '@testing-library/react-native';

import { Avatar } from '@/components/ui/avatar';

describe('Avatar', () => {
    it('saca las iniciales del nombre', async () => {
        await render(<Avatar name="Ana García" />);

        // Sin etiqueta el avatar se oculta del lector de pantalla; la consulta
        // pide los ocultos a propósito (es el contenido lo que se comprueba).
        expect(screen.getByText('AG', { includeHiddenElements: true })).toBeTruthy();
    });

    it('con un solo nombre, una inicial', async () => {
        await render(<Avatar name="Pedro" />);

        expect(screen.getByText('P', { includeHiddenElements: true })).toBeTruthy();
    });

    it('sin etiqueta se oculta del lector de pantalla', async () => {
        const { root } = await render(<Avatar name="Ana García" />);

        expect(root?.props.accessibilityElementsHidden).toBe(true);
        expect(root?.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    it('con etiqueta se anuncia una sola vez', async () => {
        await render(<Avatar name="Ana García" accessibilityLabel="Ana García" />);

        expect(screen.getByLabelText('Ana García')).toBeTruthy();
    });
});
