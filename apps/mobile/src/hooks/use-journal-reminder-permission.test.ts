import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useAfterReminderSaved } from './use-reminder-prompt';
import { getPermissionStatus } from '@/lib/notifications/permission';
import { syncNotifications } from '@/lib/notifications/sync';
jest.mock('@/lib/notifications/module', () => ({ notificationsSupported: () => true }));
jest.mock('@/lib/notifications/permission', () => ({
    getPermissionStatus: jest.fn(),
    requestPermission: jest.fn(),
}));
jest.mock('@/lib/notifications/sync', () => ({ syncNotifications: jest.fn() }));
jest.mock('@/stores/notification-settings', () => ({
    useNotificationSettings: { getState: () => ({ enabled: true, noteReminders: true }) },
}));
it('el cuaderno muestra la hoja compartida cuando se deniega el permiso', async () => {
    jest.mocked(getPermissionStatus).mockResolvedValue('denied');
    const onDenied = jest.fn(),
        native = jest.spyOn(Alert, 'alert');
    const { result } = await renderHook(() => useAfterReminderSaved('note', onDenied));
    await act(async () => {
        expect(await result.current()).toBe(false);
    });
    expect(onDenied).toHaveBeenCalledTimes(1);
    expect(native).not.toHaveBeenCalled();
    native.mockRestore();
});
it('el permiso concedido programa el recordatorio y permite cerrar el editor', async () => {
    jest.mocked(getPermissionStatus).mockResolvedValue('granted');
    const onDenied = jest.fn();
    const { result } = await renderHook(() => useAfterReminderSaved('note', onDenied));
    await act(async () => {
        expect(await result.current()).toBe(true);
    });
    expect(syncNotifications).toHaveBeenCalled();
    expect(onDenied).not.toHaveBeenCalled();
});
