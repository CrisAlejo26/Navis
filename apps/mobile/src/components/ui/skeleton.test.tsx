import { render, screen } from '@testing-library/react-native';

import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
    it('muestra su bloque', async () => {
        await render(<Skeleton className="h-4 w-40" />);

        // Es un bloque decorativo (`aria-hidden`): la consulta pide los ocultos.
        expect(screen.getByTestId('skeleton', { includeHiddenElements: true })).toBeTruthy();
    });

    it('con movimiento reducido queda estático, latiendo no', async () => {
        const reanimated = jest.requireMock<{ useReducedMotion: () => boolean }>(
            'react-native-reanimated',
        );
        reanimated.useReducedMotion = () => true;

        await render(<Skeleton className="h-4 w-40" />);

        // El estilo estático va detrás en el array: pisa la animación.
        expect(
            screen.getByTestId('skeleton', { includeHiddenElements: true }).props.style,
        ).toContainEqual({ opacity: 0.6 });

        reanimated.useReducedMotion = () => false;
    });
});
