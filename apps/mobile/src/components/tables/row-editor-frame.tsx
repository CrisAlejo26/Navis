import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { ConfirmationSheet } from './confirmation-sheet';
import type { ReactNode } from 'react';
import { AppBar } from '@/components/ui/app-bar';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function RowEditorFrame({
    title,
    dirty = false,
    onClose,
    children,
    footer,
    contentPadding = 16,
    contentWidth,
}: {
    title: string;
    dirty?: boolean;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    contentPadding?: number;
    contentWidth?: number;
}) {
    const { t } = useTranslation(),
        navigation = useNavigation(),
        bottom = usePageBottomPadding();
    const insets = useSafeAreaInsets();
    const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);
    usePreventRemove(dirty, ({ data }) =>
        setPendingExit(() => () => navigation.dispatch(data.action)),
    );
    return (
        <View className="flex-1 bg-background">
            <AppBar title={title} onBack={onClose} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : contentWidth ? 'height' : undefined}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        padding: contentPadding,
                        width: '100%',
                        maxWidth: contentWidth,
                        alignSelf: 'center',
                        paddingBottom: footer ? 24 : bottom,
                        gap: 16,
                    }}
                >
                    {children}
                </ScrollView>
                {footer ? (
                    <View
                        className="px-4 pt-3 gap-2 border-t border-border bg-background"
                        style={{ paddingBottom: insets.bottom + 12 }}
                    >
                        {footer}
                    </View>
                ) : null}
            </KeyboardAvoidingView>
            {pendingExit ? (
                <ConfirmationSheet
                    title={t('tables.mobile.discard')}
                    confirmLabel={t('tables.mobile.discard')}
                    onCancel={() => setPendingExit(null)}
                    onConfirm={() => {
                        const exit = pendingExit;
                        setPendingExit(null);
                        exit();
                    }}
                />
            ) : null}
        </View>
    );
}
