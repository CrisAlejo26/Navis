import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProfileForm } from '@/components/settings/profile-form';
import type { LocalUser } from '@/data/repos/account-repo';
import { updateProfile } from '@/data/repos/profile-repo';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/data/repos/profile-repo', () => ({ updateProfile: jest.fn() }));
jest.mock('@/stores/local-session', () => ({
    useLocalSession: (select: (state: { session: { userId: string } }) => unknown) =>
        select({ session: { userId: 'u1' } }),
}));

const user: LocalUser = {
    id: 'u1',
    name: 'Ana Ruiz',
    email: 'ana@iglesia.es',
    passwordHash: 'x',
    phone: null,
    city: 'Elda',
    bio: null,
    timezone: 'Europe/Madrid',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileForm', () => {
    it('nace con los datos de la cuenta y los guarda al pulsar Guardar', async () => {
        (updateProfile as jest.Mock).mockResolvedValue(user);
        await render(
            <QueryClientProvider client={new QueryClient()}>
                <ProfileForm user={user} />
            </QueryClientProvider>,
        );

        expect(screen.getByDisplayValue('Elda')).toBeTruthy();
        await fireEvent.changeText(screen.getByDisplayValue('Elda'), 'Petrer');
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));

        expect(updateProfile).toHaveBeenCalledWith(
            'u1',
            expect.objectContaining({ name: 'Ana Ruiz', city: 'Petrer' }),
        );
    });
});
