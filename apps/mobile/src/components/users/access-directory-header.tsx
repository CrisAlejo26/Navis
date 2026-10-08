import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/ui/search-field';
import { UsersHero } from './users-hero';
import { useUserPalette } from './user-theme';
import type { AccessDirectoryState } from './use-access-directory';

/** La cifra con el reparto por estado y el buscador: lo que enmarca la lista de accesos. */
export function AccessDirectoryHeader({ state }: { state: AccessDirectoryState }) {
    const { t } = useTranslation(),
        p = useUserPalette();
    return (
        <View>
            <UsersHero
                label={t('roles.accessTab')}
                total={state.total}
                caption={t('roles.accessCaption')}
                accent={null}
                segments={[
                    { slug: 'active', color: p.success, count: state.counts.active },
                    { slug: 'expired', color: p.warning, count: state.counts.expired },
                    { slug: 'inactive', color: p.mutedForeground, count: state.counts.inactive },
                ]}
            />
            <View style={{ paddingBottom: 12 }}>
                <SearchField
                    testID="access-search"
                    value={state.search}
                    onChangeText={state.setSearch}
                    placeholder={t('roles.searchAccess')}
                />
            </View>
        </View>
    );
}
