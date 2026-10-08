import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteRoleSheet } from './delete-role-sheet';
import { PermissionSummary } from './permission-summary';
import { RoleDetailHero } from './role-detail-hero';
import { RoleFormSheet } from './role-form-sheet';
import { useUserPalette } from './user-theme';
import { useRoleDetail } from './use-role-detail';

/** Detalle primero: el rol, qué puede hacer y, si se puede, editarlo o borrarlo. */
export function RoleDetailScreen({ id }: { id: string }) {
    const s = useRoleDetail(id),
        p = useUserPalette(),
        insets = useSafeAreaInsets(),
        { t } = useTranslation(),
        { role, display } = s;
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={role ? display.label(role.slug) : t('roles.rolesTab')} />
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
                {s.catalog.isPending ? (
                    <Skeleton className="h-[240px]" style={{ borderRadius: 26 }} />
                ) : !role ? (
                    <EmptyState
                        icon="alert-circle-outline"
                        title={t('roles.loadFailed')}
                        action={{
                            label: t('common.retry'),
                            onPress: () => void s.catalog.refetch(),
                        }}
                    />
                ) : (
                    <>
                        <RoleDetailHero
                            role={role}
                            label={display.label(role.slug)}
                            hint={display.hint(role.slug)}
                            color={display.color(role.slug)}
                        />
                        <PermissionSummary role={role} color={display.color(role.slug)} />
                        {s.canEdit && (
                            <View className="gap-3">
                                <Button
                                    testID="role-edit"
                                    title={t('roles.editRole')}
                                    size="lg"
                                    onPress={() => s.setDialog('edit')}
                                />
                                {s.canDelete && (
                                    <Button
                                        testID="role-delete"
                                        title={t('roles.deleteRole')}
                                        variant="destructive"
                                        size="lg"
                                        disabled={role.usersCount > 0}
                                        onPress={() => s.setDialog('delete')}
                                    />
                                )}
                                {s.canDelete && role.usersCount > 0 ? (
                                    <Text className="text-sm text-center text-muted-foreground">
                                        {t('roles.roleInUse')}
                                    </Text>
                                ) : null}
                            </View>
                        )}
                        {s.dialog === 'edit' && (
                            <RoleFormSheet role={role} onClose={() => s.setDialog(null)} />
                        )}
                        {s.dialog === 'delete' && (
                            <DeleteRoleSheet
                                id={role.id}
                                name={display.label(role.slug)}
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
