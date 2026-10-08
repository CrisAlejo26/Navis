import { fireEvent, render, screen } from '@testing-library/react-native';
import type { JournalEntryListItem } from '@navis/shared';
import { JournalCard } from './journal-card';
const entry: JournalEntryListItem = {
    id: 'one',
    title: 'Visita',
    kind: 'testimonio',
    occurredAt: '2026-10-08',
    excerpt: 'Conversación',
    hasLearned: true,
    hasAudio: true,
    remindAt: null,
    remindDoneAt: null,
    authorName: 'Ana',
};
it('ofrece título, tipo y metadatos sin depender del color', async () => {
    const open = jest.fn();
    await render(<JournalCard entry={entry} onPress={open} />);
    expect(screen.getByText('Testimonio')).toBeTruthy();
    expect(screen.getByLabelText('Audios')).toBeTruthy();
    expect(screen.getByLabelText('Lo aprendido')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Visita' }));
    expect(open).toHaveBeenCalledTimes(1);
});
it('la pulsación larga selecciona y en selección la tarjeta cambia la casilla', async () => {
    const open = jest.fn(),
        select = jest.fn();
    await render(
        <JournalCard entry={entry} selected selectionMode onSelect={select} onPress={open} />,
    );
    expect(screen.getByRole('checkbox').props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByRole('button', { name: 'Visita' }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
});
