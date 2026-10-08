import { router } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { elevation } from '@/lib/ui/elevation';
import { useLocalSession } from '@/stores/local-session';
import { UserCard } from './user-card';
import { UserFormSheet } from './user-form-sheet';
import { UsersHeader } from './users-header';
import { UsersEmpty, UsersSkeleton } from './users-empty';
import { useUserPalette } from './user-theme';
import { useUsersDirectory } from './use-users-directory';

/**
 * El directorio de cuentas de la iglesia (RFC 0008): cifra y reparto por rol,
 * búsqueda, filtro por rol y una ficha por cuenta. Mismos datos que `/users`
 * en la web, pedidos al puerto `UsersGateway`.
 */
export function UsersDirectory() {
    const s = useUsersDirectory(),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation(),
        me = useLocalSession((state) => state.session?.userId);
    const { pages } = s;
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={t('nav.users')} />
            <FlatList
                data={s.items}
                keyExtractor={(user) => user.id}
                keyboardShouldPersistTaps="handled"
                onEndReachedThreshold={0.6}
                onEndReached={() => {
                    if (pages.hasNextPage && !pages.isFetchingNextPage) void pages.fetchNextPage();
                }}
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + (s.canCreate ? 96 : 24),
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={<UsersHeader state={s} />}
                renderItem={({ item }) => (
                    <UserCard
                        user={item}
                        roleLabel={s.roles.label(item.role)}
                        color={s.roles.color(item.role)}
                        isMe={item.id === me}
                        onPress={() => router.push(`/users/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    pages.isPending ? (
                        <UsersSkeleton />
                    ) : (
                        <UsersEmpty
                            failed={pages.isError}
                            filtered={s.filtered}
                            onRetry={() => void pages.refetch()}
                            onClear={s.clear}
                        />
                    )
                }
                ListFooterComponent={
                    pages.isFetchingNextPage ? (
                        <ActivityIndicator color={p.primary} style={{ paddingVertical: 16 }} />
                    ) : null
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
                        testID="users-add"
                        title={t('roles.newUser')}
                        leadingIcon="person-add-outline"
                        size="lg"
                        style={elevation('floating', p.primary, p.dark)}
                        onPress={() => s.setCreating(true)}
                    />
                </View>
            )}
            {s.creating && <UserFormSheet onClose={() => s.setCreating(false)} />}
        </View>
    );
}
