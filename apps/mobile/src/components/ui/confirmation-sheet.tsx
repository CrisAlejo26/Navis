import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';

/** Shared confirmations compose the app's existing sheet and action components. */
export function ConfirmationSheet({
    title,
    subject,
    description,
    confirmLabel,
    busy = false,
    failed = false,
    onConfirm,
    onCancel,
}: {
    title: string;
    subject?: string;
    description?: string;
    confirmLabel: string;
    busy?: boolean;
    failed?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet
            visible
            title={title}
            showCloseButton={false}
            onClose={() => {
                if (!busy) onCancel();
            }}
        >
            <View className="gap-4 pb-3">
                <Icon
                    name="alert-circle-outline"
                    tone="destructive"
                    background="soft"
                    containerSize={48}
                    size="lg"
                />
                {subject ? (
                    <Text className="font-sans-semibold text-lg text-foreground">{subject}</Text>
                ) : null}
                {description ? (
                    <Text className="font-sans text-base leading-6 text-muted-foreground">
                        {description}
                    </Text>
                ) : null}
                {failed ? <FieldError message={t('errors.generic')} /> : null}
                <Button
                    testID="confirmation-confirm"
                    title={confirmLabel}
                    variant="destructive"
                    loading={busy}
                    onPress={onConfirm}
                />
                <Button
                    testID="confirmation-cancel"
                    title={t('common.cancel')}
                    variant="secondary"
                    disabled={busy}
                    onPress={onCancel}
                />
            </View>
        </BottomSheet>
    );
}
