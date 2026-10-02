import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ListForm } from './list-form';
import { MemberRow } from './member-row';
import type { ListMember } from '@navis/shared';

it('valida el alta, conserva la hoja si falla y guarda nombre y descripción', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn();
    await render(
        <SafeAreaProvider>
            <ListForm onSave={save} onClose={close} />
        </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByText('No se ha podido guardar la lista')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Nombre de la lista'), ' Sonido ');
    await fireEvent.changeText(screen.getByLabelText('Descripción'), 'Equipo de la iglesia');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
        expect(save).toHaveBeenCalledWith({
            name: 'Sonido',
            description: 'Equipo de la iglesia',
            accent: 'primary',
        }),
    );
    expect(close).toHaveBeenCalledTimes(1);
});
it('no ofrece movimientos fuera del orden ni permite gestión a un lector', async () => {
    const member: ListMember = {
        believerId: 'id',
        firstName: 'Ana',
        lastName: 'Pérez',
        position: 0,
        note: null,
        congregationId: null,
        congregationName: null,
        congregationAccent: null,
        ministries: [],
        hasPhoto: false,
        hasAccess: false,
        arrivedAt: null,
        arrivalSite: null,
        bibleReadings: null,
        vivenciasReadings: null,
        bibleInstituteTimes: null,
    };
    const move = jest.fn();
    const edit = jest.fn();
    const { rerender } = await render(
        <MemberRow
            member={member}
            index={0}
            total={2}
            canManage
            busy={false}
            onEdit={edit}
            onMove={move}
        />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Subir a Ana Pérez' }));
    expect(move).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Bajar a Ana Pérez' }));
    expect(move).toHaveBeenCalledWith(1);
    await rerender(
        <MemberRow
            member={member}
            index={0}
            total={2}
            canManage={false}
            busy={false}
            onEdit={edit}
            onMove={move}
        />,
    );
    expect(screen.queryByRole('button', { name: 'Bajar a Ana Pérez' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Nota de Ana Pérez' }));
    expect(edit).not.toHaveBeenCalled();
});
