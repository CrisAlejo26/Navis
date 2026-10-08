import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/ui/search-field';
import { RoleFilterChips } from './role-filter-chips';
import { UsersHero } from './users-hero';
import type { UsersDirectoryState } from './use-users-directory';

/** Cifra y reparto arriba, buscador y chips de rol debajo: lo que enmarca la lista. */
export function UsersHeader({ state }: { state: UsersDirectoryState }) {
    const { t } = useTranslation(),
        { roles } = state;
    return (
        <View>
            <UsersHero
                total={state.total}
                church={state.scope.church?.name ?? ''}
                accent={state.role ? roles.color(state.role) : null}
                segments={roles.roles.map((role) => ({
                    slug: role.slug,
                    color: roles.color(role.slug),
                    count: role.usersCount,
                }))}
            />
            <SearchField
                testID="users-search"
                value={state.search}
                onChangeText={state.setSearch}
                placeholder={t('roles.searchUsers')}
            />
            <RoleFilterChips
                roles={roles.roles}
                selected={state.role}
                label={roles.label}
                color={roles.color}
                onSelect={state.setRole}
            />
        </View>
    );
}
