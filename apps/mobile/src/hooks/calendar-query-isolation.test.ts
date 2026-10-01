import { isolationSuite } from '../data/test-support/church-isolation-suite';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCalendarSchedule } from './use-calendar';
import { useLocalSession } from '@/stores/local-session';
import * as schedule from '../data/repos/calendar-schedule';
import { ISOLATION_DAY, ISOLATION_OWNER } from '../data/test-support/seed-two-churches';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
const suite = isolationSuite();
// I4: mientras llega el nuevo tramo, no se enseña el calendario de otra iglesia.
it('el calendario no conserva datos provisionales de la iglesia anterior', async () => {
    const { north, south } = suite.churches();
    const before = useLocalSession.getState().session;
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    useLocalSession.getState().setSession({ userId: ISOLATION_OWNER, churchId: north.churchId });
    const { result, unmount } = await renderHook(
        () => useCalendarSchedule(north.calendarId, ISOLATION_DAY, ISOLATION_DAY),
        { wrapper },
    );
    const original = schedule.calendarRange;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    const spy = jest.spyOn(schedule, 'calendarRange');
    try {
        await waitFor(() =>
            expect(
                result.current.data?.days[0]?.meetings.some((one) => one.name === 'N-Reunión'),
            ).toBe(true),
        );
        spy.mockImplementation(async (...args) => {
            await gate;
            return original(...args);
        });
        await act(() => useLocalSession.getState().setChurch(south.churchId));
        expect(result.current.data).toBeUndefined();
        await act(() => release());
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.days.flatMap((day) => day.meetings)).toEqual([]);
    } finally {
        release();
        await unmount();
        await client.cancelQueries();
        client.clear();
        spy.mockRestore();
        useLocalSession.setState({ session: before });
    }
});
