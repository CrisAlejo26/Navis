import { fireEvent, render, screen } from '@testing-library/react-native';

import { TeachingCard } from '@/components/teachings/teaching-card';

const BASE = {
    id: 'a',
    title: 'Sobre la paciencia',
    excerpt: 'Esperar sin quejarse',
    receivedAt: '2026-03-14',
};

describe('la tarjeta de una enseñanza', () => {
    it('enseña el título, el extracto y la cuenta de la checklist escrita', async () => {
        await render(
            <TeachingCard
                teaching={{ ...BASE, checklist: { checked: 1, total: 3 } }}
                onPress={jest.fn()}
            />,
        );

        expect(screen.getByText('Sobre la paciencia')).toBeTruthy();
        expect(screen.getByText('Esperar sin quejarse')).toBeTruthy();
        expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('sin checklist no pinta la cuenta', async () => {
        await render(<TeachingCard teaching={{ ...BASE, checklist: null }} onPress={jest.fn()} />);

        expect(screen.queryByText(/\//)).toBeNull();
    });

    it('al tocarla abre la ficha', async () => {
        const onPress = jest.fn();
        await render(<TeachingCard teaching={{ ...BASE, checklist: null }} onPress={onPress} />);

        await fireEvent.press(screen.getByRole('button', { name: /Sobre la paciencia/ }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
