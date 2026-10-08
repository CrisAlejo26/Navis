import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { elevation } from '@/lib/ui/elevation';
import { RoleCard } from './role-card';
import { RoleFormSheet } from './role-form-sheet';
import { UsersSkeleton } from './users-empty';
import { UsersHero } from './users-hero';
import { useUserPalette } from './user-theme';
import { useRolesDirectory } from './use-roles-directory';

/** El catálogo de roles: cuántos hay, cuál puede más, y una ficha por rol. */
export function RolesDirectory() {
    const s = useRolesDirectory(),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation(),
        { display } = s;
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <FlatList
                data={s.items}
                keyExtractor={(role) => role.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + (s.canCreate ? 96 : 24),
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={
                    <View>
                        <UsersHero
                            label={t('roles.rolesTab')}
                            total={s.total}
                            caption={t('roles.description')}
                            accent={null}
                            segments={s.items.map((role) => ({
                                slug: role.slug,
                                color: display.color(role.slug),
                                count: 1,
                            }))}
                        />
                        <View style={{ paddingBottom: 12 }}>
                            <SearchField
                                testID="roles-search"
                                value={s.search}
                                onChangeText={s.setSearch}
                                placeholder={t('roles.searchRoles')}
                            />
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <RoleCard
                        role={item}
                        label={display.label(item.slug)}
                        hint={display.hint(item.slug)}
                        color={display.color(item.slug)}
                        onPress={() => router.push(`/users/roles/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    s.catalog.isPending ? (
                        <UsersSkeleton />
                    ) : (
                        <EmptyState icon="search-outline" title={t('roles.noRoles')} />
                    )
                }
            />
            {s.canCreate && (
                <View
                    pointerEvents="box-none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: insets.bottom + 16,
                        alignItems: 'center',
                    }}
                >
                    <Button
                        testID="roles-add"
                        title={t('roles.newRole')}
                        leadingIcon="shield-checkmark-outline"
                        size="lg"
                        style={elevation('floating', p.primary, p.dark)}
                        onPress={() => s.setCreating(true)}
                    />
                </View>
            )}
            {s.creating && <RoleFormSheet onClose={() => s.setCreating(false)} />}
        </View>
    );
}
