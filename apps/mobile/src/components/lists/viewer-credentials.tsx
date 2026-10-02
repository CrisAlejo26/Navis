import { useTranslation } from 'react-i18next';
import { Share, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

export function ViewerCredentials({ username, password }: { username: string; password: string }) {
    const { t } = useTranslation();
    return (
        <View className="gap-3 p-4 rounded-xl border border-border">
            <Text selectable className="text-base font-sans-semibold text-foreground">
                {t('lists.username')}: {username}
            </Text>
            <Text selectable className="text-base text-foreground">
                {t('lists.password')}: {password}
            </Text>
            <Text className="text-sm text-muted-foreground">{t('lists.passwordOnce')}</Text>
            <Text className="text-sm text-muted-foreground">{t('lists.localAccessHint')}</Text>
            <Button
                title={t('export.send')}
                variant="secondary"
                onPress={() =>
                    void Share.share({
                        message: `${t('lists.username')}: ${username}\n${t('lists.password')}: ${password}\n${t('lists.localAccessHint')}`,
                    }).catch(() => undefined)
                }
            />
        </View>
    );
}
