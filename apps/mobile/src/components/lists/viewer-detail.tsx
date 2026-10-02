import type { ListViewer } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { FieldError } from '@/components/ui/field-error';
import { useViewerDetail } from '@/hooks/use-viewer-detail';
import { ViewerGrants } from './viewer-grants';
import { ViewerCredentials } from './viewer-credentials';

export function ViewerDetail({ viewer, onClose }: { viewer: ListViewer; onClose: () => void }) {
    const { t } = useTranslation();
    const state = useViewerDetail(viewer, onClose);
    const { lists, confirm, password, label, expires, busy, failed } = state;
    return (
        <BottomSheet
            visible
            title={viewer.label}
            onClose={() => {
                if (!busy) onClose();
            }}
        >
            <View className="gap-4 pb-3">
                {password ? (
                    <>
                        <ViewerCredentials username={viewer.username} password={password} />
                        <Button title={t('common.close')} onPress={onClose} />
                    </>
                ) : confirm ? (
                    <>
                        <Text className="text-foreground">{t('lists.localRevokeExplain')}</Text>
                        <Button
                            title={t('lists.revoke')}
                            variant="destructive"
                            loading={state.removing}
                            onPress={state.revoke}
                        />
                        <Button
                            title={t('common.cancel')}
                            variant="ghost"
                            disabled={busy}
                            onPress={() => state.setConfirm(false)}
                        />
                    </>
                ) : (
                    <>
                        <Text className="text-sm text-muted-foreground">{viewer.username}</Text>
                        <ViewerGrants
                            lists={lists.data ?? []}
                            selected={viewer.listIds}
                            disabled={busy || lists.isPending}
                            onChange={state.grant}
                        />
                        <Switch
                            label={t('lists.active')}
                            checked={viewer.isActive}
                            disabled={busy}
                            onChange={state.activate}
                        />
                        <TextField
                            label={t('lists.viewerLabel')}
                            value={label}
                            maxLength={80}
                            editable={!busy}
                            onChangeText={state.setLabel}
                        />
                        <TextField
                            label={t('lists.expiresAt')}
                            placeholder="YYYY-MM-DD"
                            value={expires}
                            maxLength={10}
                            editable={!busy}
                            onChangeText={state.setExpires}
                        />
                        <Button
                            title={t('common.save')}
                            loading={state.saving}
                            disabled={busy}
                            onPress={state.save}
                        />
                        <Button
                            title={t('lists.regeneratePassword')}
                            variant="secondary"
                            disabled={busy}
                            onPress={state.regenerate}
                        />
                        <Button
                            title={t('lists.revoke')}
                            variant="destructive"
                            disabled={busy}
                            onPress={() => state.setConfirm(true)}
                        />
                    </>
                )}
                {failed ? <FieldError message={t('lists.viewerSaveFailed')} /> : null}
            </View>
        </BottomSheet>
    );
}
