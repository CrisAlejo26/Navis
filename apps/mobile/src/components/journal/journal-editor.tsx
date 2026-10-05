import type { ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { useKeyboardHeight } from '@/lib/ui/keyboard';
import { useJournalPalette } from './journal-theme';

/** Full-screen writing surface; the save action stays outside the scroll body. */
export function JournalEditor({
    title,
    saving,
    onClose,
    onSave,
    children,
}: {
    title: string;
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
    children: ReactNode;
}) {
    const p = useJournalPalette(),
        insets = useSafeAreaInsets(),
        keyboard = useKeyboardHeight(),
        { t } = useTranslation(),
        reducedMotion = useReducedMotion();
    return (
        <Modal
            visible
            animationType={reducedMotion ? 'none' : 'slide'}
            onRequestClose={onClose}
            statusBarTranslucent
            navigationBarTranslucent
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: p.background,
                    paddingTop: insets.top,
                    paddingBottom: Math.max(keyboard, insets.bottom),
                }}
            >
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        borderBottomWidth: 1,
                        borderColor: p.line,
                    }}
                >
                    <IconButton
                        icon="close"
                        accessibilityLabel={t('common.close')}
                        onPress={onClose}
                        disabled={saving}
                    />
                    <Text
                        accessibilityRole="header"
                        style={{ flex: 1, color: p.ink, fontSize: 18, fontWeight: '700' }}
                    >
                        {title}
                    </Text>
                    <Button title={t('common.save')} size="sm" loading={saving} onPress={onSave} />
                </View>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{
                        padding: 20,
                        gap: 24,
                        maxWidth: 720,
                        width: '100%',
                        alignSelf: 'center',
                    }}
                >
                    {children}
                </ScrollView>
            </View>
        </Modal>
    );
}
