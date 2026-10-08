import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RolesDirectory } from './roles-directory';
import { UsersDirectory } from './users-directory';
import { useUserPalette } from './user-theme';

type UsersTab = 'users' | 'roles';

/**
 * Usuarios y roles en una sola pantalla, como en la web: la barra y las pestañas
 * son fijas y cada lista conserva su búsqueda y su posición al cambiar.
 */
export function UsersScreen() {
    const { t } = useTranslation(),
        p = useUserPalette();
    const [tab, setTab] = useState<UsersTab>('users');
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={t('roles.title')} />
            <View
                style={{
                    paddingHorizontal: 22,
                    paddingBottom: 8,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
            >
                <SegmentedControl
                    options={[
                        { value: 'users', label: t('roles.usersTab') },
                        { value: 'roles', label: t('roles.rolesTab') },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            </View>
            <View style={{ flex: 1, display: tab === 'users' ? 'flex' : 'none' }}>
                <UsersDirectory />
            </View>
            <View style={{ flex: 1, display: tab === 'roles' ? 'flex' : 'none' }}>
                <RolesDirectory />
            </View>
        </View>
    );
}
