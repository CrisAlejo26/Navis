import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
    it('muestra título y descripción', async () => {
        await render(
            <EmptyState icon="compass" title="Sin notas" description="Aún no has escrito nada." />,
        );

        expect(screen.getByText('Sin notas')).toBeTruthy();
        expect(screen.getByText('Aún no has escrito nada.')).toBeTruthy();
    });

    it('la acción opcional dispara su onPress', async () => {
        const onPress = jest.fn();
        await render(<EmptyState title="Sin notas" action={{ label: 'Nueva nota', onPress }} />);

        await fireEvent.press(screen.getByRole('button', { name: 'Nueva nota' }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('sin acción no hay botón', async () => {
        await render(<EmptyState title="Sin notas" />);

        expect(screen.queryByRole('button')).toBeNull();
    });
});
