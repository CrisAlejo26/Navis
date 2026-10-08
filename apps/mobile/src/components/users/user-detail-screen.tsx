import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteUserSheet } from './delete-user-sheet';
import { PasswordSheet } from './password-sheet';
import { UserDetailActions } from './user-detail-actions';
import { UserDetailHero } from './user-detail-hero';
import { UserDetailInfo } from './user-detail-info';
import { UserFormSheet } from './user-form-sheet';
import { useUserPalette } from './user-theme';
import { useUserDetail } from './use-user-detail';

/** Detalle primero (no un formulario): quién es, qué hace su rol y, si se puede, las acciones. */
export function UserDetailScreen({ id }: { id: string }) {
    const s = useUserDetail(id),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation(),
        user = s.user.data;
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={user?.name ?? t('nav.users')} />
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 24,
                    gap: 16,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
            >
                {s.user.isPending ? (
                    <Skeleton className="h-[240px]" style={{ borderRadius: 26 }} />
                ) : !user ? (
                    <EmptyState
                        icon="alert-circle-outline"
                        title={t('roles.loadFailed')}
                        action={{ label: t('common.retry'), onPress: () => void s.user.refetch() }}
                    />
                ) : (
                    <>
                        <UserDetailHero
                            user={user}
                            roleLabel={s.display.label(user.role)}
                            color={s.display.color(user.role)}
                        />
                        <UserDetailInfo
                            roleText={s.display.hint(user.role) ?? s.display.label(user.role)}
                            joinedAt={user.createdAt}
                        />
                        {s.isMe ? (
                            <Text className="text-sm text-center text-muted-foreground">
                                {t('roles.ownRole')}
                            </Text>
                        ) : null}
                        {s.canAct ? <UserDetailActions onOpen={s.setDialog} /> : null}
                        {s.dialog === 'edit' && (
                            <UserFormSheet user={user} onClose={() => s.setDialog(null)} />
                        )}
                        {s.dialog === 'password' && (
                            <PasswordSheet user={user} onClose={() => s.setDialog(null)} />
                        )}
                        {s.dialog === 'delete' && (
                            <DeleteUserSheet
                                user={user}
                                onClose={() => s.setDialog(null)}
                                onDeleted={() => router.back()}
                            />
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
