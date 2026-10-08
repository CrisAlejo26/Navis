import { fireEvent, render, screen } from '@testing-library/react-native';
import { ENTRY_KINDS, type JournalStats } from '@navis/shared';
import { JournalOverview } from './journal-overview';
jest.mock('react-native-gifted-charts', () => ({ BarChart: () => null }));

it('permite consultar los doce meses en grupos legibles y el valor de cada barra', async () => {
    const stats: JournalStats = {
        total: 18,
        pendingReminders: 2,
        thisMonth: 3,
        byKind: Object.fromEntries(ENTRY_KINDS.map((k) => [k, 0])) as JournalStats['byKind'],
        monthly: Array.from({ length: 12 }, (_, i) => ({
            month: `2026-${String(i + 1).padStart(2, '0')}`,
            total: i + 1,
        })),
    };
    await render(<JournalOverview stats={stats} onOpen={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'ene: 1' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'oct: 10' }));
    expect(screen.getByText('oct: 10')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Seis meses anteriores' }));
    expect(screen.getByRole('button', { name: 'ene: 1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'oct: 10' })).toBeNull();
});
