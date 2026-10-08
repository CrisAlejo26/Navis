import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';

export function JournalEditor({
    title,
    saving,
    onClose,
    onSave,
    saveTitle,
    disabled,
    children,
}: {
    title: string;
    saving: boolean;
    onClose: () => void;
    onSave?: () => void;
    saveTitle?: string;
    disabled?: boolean;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet
            visible
            fullScreen
            title={title}
            onClose={() => {
                if (!saving) onClose();
            }}
            footer={
                onSave ? (
                    <View className="pt-3 border-t border-border">
                        <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
                            <Button
                                testID="journal-save"
                                title={saveTitle ?? t('common.save')}
                                size="lg"
                                loading={saving}
                                disabled={disabled}
                                onPress={onSave}
                            />
                        </View>
                    </View>
                ) : undefined
            }
        >
            <View
                style={{ padding: 6, gap: 24, maxWidth: 480, width: '100%', alignSelf: 'center' }}
            >
                {children}
            </View>
        </BottomSheet>
    );
}
