import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ViewerForm } from '@/components/lists/viewer-form';
import { elevation } from '@/lib/ui/elevation';
import { AccessCard } from './access-card';
import { AccessDirectoryHeader } from './access-directory-header';
import { UsersSkeleton } from './users-empty';
import { useUserPalette } from './user-theme';
import { useAccessDirectory } from './use-access-directory';

/**
 * Los accesos de lectura de la iglesia: usuario y contraseña propios para abrir
 * listas restringidas (RFC 0010 D22). No son cuentas, y la cabecera lo dice.
 */
export function AccessDirectory() {
    const s = useAccessDirectory(),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation();
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <FlatList
                data={s.items}
                keyExtractor={(viewer) => viewer.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 96,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={<AccessDirectoryHeader state={s} />}
                renderItem={({ item }) => (
                    <AccessCard
                        viewer={item}
                        lists={s.lists}
                        status={s.statusOf(item)}
                        onPress={() => router.push(`/users/access/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    s.viewers.isPending ? (
                        <UsersSkeleton />
                    ) : s.viewers.isError ? (
                        <EmptyState
                            icon="alert-circle-outline"
                            title={t('roles.loadFailed')}
                            action={{
                                label: t('common.retry'),
                                onPress: () => void s.viewers.refetch(),
                            }}
                        />
                    ) : s.total === 0 ? (
                        <EmptyState
                            icon="key-outline"
                            title={t('lists.noViewers')}
                            description={t('lists.accessEmptyBody')}
                        />
                    ) : (
                        <EmptyState icon="search-outline" title={t('roles.noAccessMatch')} />
                    )
                }
            />
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
                    testID="access-add"
                    title={t('lists.newViewer')}
                    leadingIcon="key-outline"
                    size="lg"
                    style={elevation('floating', p.primary, p.dark)}
                    onPress={() => s.setCreating(true)}
                />
            </View>
            {s.creating && <ViewerForm onClose={() => s.setCreating(false)} />}
        </View>
    );
}
