import { fireEvent, render, screen } from '@testing-library/react-native';
import { JournalTime } from './journal-time';

it('elige horas y minutos con los selectores de la app sin perder precisi�n', async () => {
    const change = jest.fn();
    const view = await render(<JournalTime value="19:30" onChange={change} />);
    await fireEvent.press(screen.getByRole('button', { name: /Hora/ }));
    await fireEvent.press(screen.getByRole('button', { name: '08' }));
    expect(change).toHaveBeenLastCalledWith('08:30');
    await view.rerender(<JournalTime value="08:30" onChange={change} />);
    await fireEvent.press(screen.getByRole('button', { name: /Minutos/ }));
    await fireEvent.press(screen.getByRole('button', { name: '05' }));
    expect(change).toHaveBeenLastCalledWith('08:05');
});
