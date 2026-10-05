import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { CustomTableWithColumns } from '@navis/shared';
import { useTableExport } from './use-table-export';
import { tableExport } from '@/lib/tables/export';
import { shareListFile } from '@/lib/lists/share-file';

jest.mock('./use-tables', () => ({ useTableContext: () => ({ context: {} }) }));
jest.mock('@/lib/tables/export', () => ({ tableExport: jest.fn() }));
jest.mock('@/lib/lists/share-file', () => ({ shareListFile: jest.fn() }));

const table = {
    id: 'table',
    slug: 'qa',
    columns: [{ key: 'secret', type: 'password' }],
} as CustomTableWithColumns;

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(tableExport).mockResolvedValue({ rows: [['secret']] } as never);
    jest.mocked(shareListFile).mockResolvedValue(undefined);
});

async function pendingExport() {
    const hook = await renderHook(() => useTableExport(table, {}));
    await act(() => hook.result.current.setKeys(['secret']));
    let pending: Promise<void>;
    await act(() => {
        pending = hook.result.current.send();
    });
    await waitFor(() => expect(hook.result.current.passwordWarning).toBe(1));
    return { hook, pending: pending! };
}

it('espera la confirmación del panel antes de compartir contraseñas', async () => {
    const { hook, pending } = await pendingExport();
    expect(shareListFile).not.toHaveBeenCalled();
    await act(async () => {
        hook.result.current.resolvePassword(true);
        await pending;
    });
    expect(shareListFile).toHaveBeenCalledTimes(1);
    expect(hook.result.current.busy).toBe(false);
    await hook.unmount();
});

it('cancelar el aviso termina la exportación sin compartir', async () => {
    const { hook, pending } = await pendingExport();
    await act(async () => {
        hook.result.current.cancelExport();
        await pending;
    });
    expect(shareListFile).not.toHaveBeenCalled();
    expect(hook.result.current.passwordWarning).toBeNull();
    expect(hook.result.current.busy).toBe(false);
    await hook.unmount();
});

it('cerrar el panel resuelve el aviso pendiente sin compartir', async () => {
    const { hook, pending } = await pendingExport();
    await hook.unmount();
    await pending;
    expect(shareListFile).not.toHaveBeenCalled();
});
