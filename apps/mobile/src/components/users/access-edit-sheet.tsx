import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { TextField } from '@/components/ui/text-field';
import type { useViewerDetail } from '@/hooks/use-viewer-detail';

/** El nombre para reconocerlo y la fecha de caducidad. */
export function AccessEditSheet({
    state,
    onClose,
}: {
    state: ReturnType<typeof useViewerDetail>;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible title={t('roles.accessEdit')} onClose={onClose}>
            <View className="gap-4 pb-3">
                <TextField
                    testID="access-label"
                    label={t('lists.viewerLabel')}
                    value={state.label}
                    maxLength={80}
                    editable={!state.busy}
                    onChangeText={state.setLabel}
                />
                <TextField
                    testID="access-expires"
                    label={t('lists.expiresAt')}
                    placeholder="YYYY-MM-DD"
                    value={state.expires}
                    maxLength={10}
                    editable={!state.busy}
                    onChangeText={state.setExpires}
                />
                {state.failed ? <FieldError message={t('lists.viewerSaveFailed')} /> : null}
                <Button
                    testID="access-save"
                    title={t('common.save')}
                    size="lg"
                    loading={state.saving}
                    onPress={() => void state.save().then(onClose, () => undefined)}
                />
            </View>
        </BottomSheet>
    );
}
