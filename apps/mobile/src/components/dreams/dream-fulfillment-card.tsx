import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LocalDream } from '@/data/repos/dreams-repo';
import { formatDay } from '@/lib/format';

interface DreamFulfillmentProps {
    dream: LocalDream;
    onFulfill: () => void;
    onReopen: () => void;
}

/** Cumplido: la fecha y lo que significó (D10). Sin cumplir: la invitación a marcarlo. */
export function DreamFulfillment({ dream, onFulfill, onReopen }: DreamFulfillmentProps) {
    const { t } = useTranslation();
    if (!dream.fulfilledAt) {
        return <Button title={t('dreams.markFulfilled')} variant="secondary" onPress={onFulfill} />;
    }
    return (
        <Card className="rounded-2xl">
            <Text className="text-sm font-sans-semibold text-success">
                {t('dreams.fulfilledOn', { date: formatDay(dream.fulfilledAt) })}
            </Text>
            {dream.fulfillmentMeaning ? (
                <Text className="text-base leading-6 text-foreground">
                    {dream.fulfillmentMeaning}
                </Text>
            ) : null}
            <View className="gap-4 flex-row">
                <Pressable accessibilityRole="button" onPress={onFulfill}>
                    <Text className="text-sm font-sans-medium text-primary">
                        {t('common.edit')}
                    </Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={onReopen}>
                    <Text className="text-sm font-sans-medium text-muted-foreground">
                        {t('dreams.reopen')}
                    </Text>
                </Pressable>
            </View>
        </Card>
    );
}
