import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ListSummary, ListViewer } from '@navis/shared';

import { Button } from '@/components/ui/button';
import { useViewerDetail } from '@/hooks/use-viewer-detail';
import { formatMediumDate } from '@/lib/format';
import { accessStatus } from '@/lib/users/access-status';
import { AccessCredentialsSheet } from './access-credentials-sheet';
import { AccessDetailHero } from './access-detail-hero';
import { AccessDetailInfo } from './access-detail-info';
import { AccessEditSheet } from './access-edit-sheet';
import { AccessListsCard } from './access-lists-card';
import { AccessListsSheet } from './access-lists-sheet';
import { useAccessStatusDisplay } from './access-parts';
import { AccessRevokeSheet } from './access-revoke-sheet';

type Dialog = 'lists' | 'edit' | 'revoke';

/**
 * Lo que enseña la ficha de un acceso ya cargado: estado, datos, a qué listas
 * llega y las acciones. El estado de las escrituras es el de `useViewerDetail`,
 * el mismo que usa la hoja de gestión de cada lista.
 */
export function AccessDetailBody({
    viewer,
    lists,
}: {
    viewer: ListViewer;
    lists: readonly ListSummary[];
}) {
    const { t } = useTranslation(),
        state = useViewerDetail(viewer, () => router.back()),
        shown = useAccessStatusDisplay()(accessStatus(viewer));
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const day = (iso: string | null) => (iso ? formatMediumDate(new Date(iso)) : null);
    const close = () => setDialog(null);
    return (
        <>
            <AccessDetailHero viewer={viewer} statusLabel={shown.label} color={shown.color} />
            <AccessDetailInfo
                rows={[
                    { label: t('lists.forBeliever'), value: viewer.believerName },
                    {
                        label: t('roles.accessLastSeen'),
                        value: day(viewer.lastSeenAt) ?? t('lists.neverEnteredShort'),
                    },
                    { label: t('lists.expiresAt'), value: day(viewer.expiresAt) },
                    { label: t('roles.columnCreated'), value: day(viewer.createdAt) },
                ]}
            />
            <AccessListsCard
                viewer={viewer}
                lists={lists}
                busy={state.busy}
                onChangeLists={() => setDialog('lists')}
                onActive={state.activate}
            />
            <View className="gap-3">
                <Button
                    testID="access-edit"
                    title={t('roles.accessEdit')}
                    size="lg"
                    onPress={() => setDialog('edit')}
                />
                <Button
                    testID="access-password"
                    title={t('lists.regeneratePassword')}
                    variant="outline"
                    size="lg"
                    disabled={state.busy}
                    onPress={state.regenerate}
                />
                <Button
                    testID="access-revoke"
                    title={t('lists.revoke')}
                    variant="destructive"
                    size="lg"
                    onPress={() => setDialog('revoke')}
                />
            </View>
            {dialog === 'lists' && (
                <AccessListsSheet viewer={viewer} state={state} onClose={close} />
            )}
            {dialog === 'edit' && <AccessEditSheet state={state} onClose={close} />}
            {dialog === 'revoke' && <AccessRevokeSheet state={state} onClose={close} />}
            {state.password ? (
                <AccessCredentialsSheet
                    viewer={viewer}
                    password={state.password}
                    onClose={state.clearPassword}
                />
            ) : null}
        </>
    );
}
