import type { ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Checkbox } from '@/components/ui/checkbox';

export function ViewerGrants({
    lists,
    selected,
    onChange,
    disabled,
}: {
    lists: readonly ListSummary[];
    selected: string[];
    onChange: (ids: string[]) => void;
    disabled: boolean;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-foreground">
                {t('lists.grantLists')}
            </Text>
            {lists.map((one) => (
                <Checkbox
                    key={one.id}
                    label={one.name}
                    checked={selected.includes(one.id)}
                    disabled={disabled}
                    onChange={(checked) =>
                        onChange(
                            checked
                                ? [...selected, one.id]
                                : selected.filter((id) => id !== one.id),
                        )
                    }
                />
            ))}
        </View>
    );
}
