import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatMediumDate } from '@/lib/format';

/** Qué hace el rol y desde cuándo está la cuenta: lo que la cabecera no dice. */
export function UserDetailInfo({ roleText, joinedAt }: { roleText: string; joinedAt: Date }) {
    const { t } = useTranslation();
    return (
        <View className="gap-3 rounded-3xl p-4 bg-card">
            <Text className="font-sans-semibold text-xs text-muted-foreground uppercase">
                {t('roles.role')}
            </Text>
            <Text className="text-base leading-6 text-foreground">{roleText}</Text>
            <Text className="font-sans-semibold text-xs text-muted-foreground uppercase">
                {t('roles.columnCreated')}
            </Text>
            <Text className="text-base text-foreground">{formatMediumDate(joinedAt)}</Text>
        </View>
    );
}
