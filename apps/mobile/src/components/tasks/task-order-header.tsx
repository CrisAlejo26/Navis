import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function TaskOrderHeader({
    selectedCount,
    busy,
    onMove,
}: {
    selectedCount: number;
    busy: boolean;
    onMove: (direction: -1 | 1) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-3 pb-4">
            <Text className="font-sans text-sm text-muted-foreground">{t('tasks.orderHint')}</Text>
            {selectedCount > 0 && (
                <View className="gap-2 flex-row flex-wrap">
                    {([-1, 1] as const).map((direction) => (
                        <Button
                            key={direction}
                            title={t(direction === -1 ? 'tasks.orderUp' : 'tasks.orderDown')}
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onPress={() => onMove(direction)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
