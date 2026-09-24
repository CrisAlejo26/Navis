import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProphecyFulfillmentToggle } from '@/components/prophecies/prophecy-fulfillment-toggle';

describe('el interruptor «Ya se cumplió»', () => {
    it('con la profecía en espera, no enseña el selector de fecha', async () => {
        await render(<ProphecyFulfillmentToggle fulfilledAt={null} onChange={jest.fn()} />);

        expect(screen.queryByText('Cuándo se cumplió')).toBeNull();
    });

    it('al encenderlo, guarda el día de hoy', async () => {
        const onChange = jest.fn();
        await render(<ProphecyFulfillmentToggle fulfilledAt={null} onChange={onChange} />);

        await fireEvent.press(screen.getByRole('switch', { name: 'Ya se cumplió' }));

        expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    });

    it('con una fecha puesta, enseña el selector de fecha', async () => {
        await render(<ProphecyFulfillmentToggle fulfilledAt="2026-05-01" onChange={jest.fn()} />);

        expect(screen.getByText('Cuándo se cumplió')).toBeTruthy();
    });

    it('al apagarlo, limpia la fecha', async () => {
        const onChange = jest.fn();
        await render(<ProphecyFulfillmentToggle fulfilledAt="2026-05-01" onChange={onChange} />);

        await fireEvent.press(screen.getByRole('switch', { name: 'Ya se cumplió' }));

        expect(onChange).toHaveBeenCalledWith(null);
    });
});
