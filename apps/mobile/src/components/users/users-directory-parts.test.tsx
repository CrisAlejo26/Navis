import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ManagedUser, RoleRow } from '@navis/shared';

import { RoleFilterChips } from './role-filter-chips';
import { UserCard } from './user-card';
import { UsersEmpty } from './users-empty';
import { UsersHero } from './users-hero';

const user: ManagedUser = {
    id: 'u1',
    name: 'Ana García',
    email: 'ana@navis.app',
    role: 'recepcion',
    emailVerified: true,
    createdAt: new Date('2026-10-08T12:00:00Z'),
};

function role(slug: string, usersCount: number): RoleRow {
    return {
        id: slug,
        slug,
        name: null,
        description: null,
        level: 1,
        permissions: [],
        isSystem: true,
        usersCount,
    };
}

describe('directorio de usuarios: piezas', () => {
    it('la ficha dice quién es, su rol y cuándo entró, marca la cuenta propia y se abre al pulsarla', async () => {
        const open = jest.fn();
        const view = await render(
            <UserCard
                user={user}
                roleLabel="Recepción"
                color="#0891b2"
                isMe={false}
                onPress={open}
            />,
        );
        expect(screen.getByLabelText('Ana García, Recepción, ana@navis.app')).toBeTruthy();
        expect(screen.getByText('AG', { includeHiddenElements: true })).toBeTruthy();
        expect(screen.getByText('Recepción')).toBeTruthy();
        expect(screen.queryByText('Tú')).toBeNull();
        await view.rerender(
            <UserCard user={user} roleLabel="Recepción" color="#0891b2" isMe onPress={open} />,
        );
        await fireEvent.press(screen.getByTestId('user-card-ana@navis.app'));
        expect(open).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Tú')).toBeTruthy();
    });

    it('los chips filtran por rol, vuelven a «todos» al repetir y omiten los roles sin cuentas', async () => {
        const onSelect = jest.fn();
        const roles = [role('pastor', 2), role('sonido', 0), role('recepcion', 5)];
        const label = (slug: string) => slug.toUpperCase();
        const props = { roles, label, color: () => '#2140cf', onSelect };
        const view = await render(<RoleFilterChips {...props} selected={null} />);
        expect(screen.queryByText('SONIDO · 0')).toBeNull();
        await fireEvent.press(screen.getByText('RECEPCION · 5'));
        expect(onSelect).toHaveBeenLastCalledWith('recepcion');
        await view.rerender(<RoleFilterChips {...props} selected="recepcion" />);
        await fireEvent.press(screen.getByText('RECEPCION · 5'));
        expect(onSelect).toHaveBeenLastCalledWith(null);
        await fireEvent.press(screen.getByText('Todos los roles'));
        expect(onSelect).toHaveBeenLastCalledWith(null);
    });

    it('la cabecera enseña el total y la iglesia, y no dibuja el reparto si no hay cuentas', async () => {
        const view = await render(
            <UsersHero
                label="Cuentas"
                total={12}
                caption="con acceso a Iglesia Norte"
                accent={null}
                segments={[{ slug: 'pastor', color: '#2140cf', count: 3 }]}
            />,
        );
        expect(screen.getByText('12')).toBeTruthy();
        expect(screen.getByText('con acceso a Iglesia Norte')).toBeTruthy();
        await view.rerender(
            <UsersHero
                label="Cuentas"
                total={0}
                caption="con acceso a Iglesia Norte"
                accent="#16a34a"
                segments={[]}
            />,
        );
        expect(screen.getByText('0')).toBeTruthy();
    });

    it('distingue el error, los filtros sin resultados y la iglesia sin más cuentas', async () => {
        const retry = jest.fn(),
            clear = jest.fn();
        const view = await render(
            <UsersEmpty failed filtered={false} onRetry={retry} onClear={clear} />,
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
        expect(retry).toHaveBeenCalledTimes(1);

        await view.rerender(<UsersEmpty failed={false} filtered onRetry={retry} onClear={clear} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Quitar filtros' }));
        expect(clear).toHaveBeenCalledTimes(1);

        await view.rerender(
            <UsersEmpty failed={false} filtered={false} onRetry={retry} onClear={clear} />,
        );
        expect(screen.getByText('Aún no hay nadie más con acceso')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });
});
