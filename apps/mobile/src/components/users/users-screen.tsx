import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useListContext } from '@/hooks/use-lists';
import { AccessDirectory } from './access-directory';
import { RolesDirectory } from './roles-directory';
import { UsersDirectory } from './users-directory';
import { useUserPalette } from './user-theme';

type UsersTab = 'users' | 'roles' | 'access';

/**
 * Usuarios, roles y accesos de lectura en una sola pantalla, como en la web: la
 * barra y las pestañas son fijas y cada lista conserva su búsqueda y su posición.
 * La de accesos solo sale a quien puede compartir listas (`lists.share`) y es
 * dueño de la iglesia: es lo que exige escribir en ellos en local.
 */
export function UsersScreen() {
    const { t } = useTranslation(),
        p = useUserPalette(),
        permissions = useUserPermissions(),
        { canManage } = useListContext();
    const [tab, setTab] = useState<UsersTab>('users');
    const showAccess = permissions.canShareLists && canManage;
    const options: { value: UsersTab; label: string }[] = [
        { value: 'users', label: t('roles.usersTab') },
        { value: 'roles', label: t('roles.rolesTab') },
        ...(showAccess ? [{ value: 'access' as const, label: t('roles.accessTab') }] : []),
    ];
    const pane = (value: UsersTab) => ({
        flex: 1,
        display: tab === value ? ('flex' as const) : ('none' as const),
    });
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
                <SegmentedControl options={options} value={tab} onChange={setTab} />
            </View>
            <View style={pane('users')}>
                <UsersDirectory />
            </View>
            <View style={pane('roles')}>
                <RolesDirectory />
            </View>
            {showAccess && (
                <View style={pane('access')}>
                    <AccessDirectory />
                </View>
            )}
        </View>
    );
}
