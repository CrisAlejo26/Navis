import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { useTranslation } from 'react-i18next';

export function ViewOption({
    name,
    kind,
    selected,
    onSelect,
    onEdit,
    onDelete,
}: {
    name: string;
    kind: 'grid' | 'kanban' | 'calendar';
    selected: boolean;
    onSelect: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const { t } = useTranslation();
    return (
        <View
            className={
                selected
                    ? 'gap-1 rounded-2xl p-2 flex-row items-center border border-primary bg-primary/10'
                    : 'gap-1 rounded-2xl p-2 flex-row items-center border border-border bg-card'
            }
        >
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={onSelect}
                className="gap-3 px-2 py-3 flex-1 flex-row items-center"
            >
                <Icon
                    name={
                        kind === 'grid'
                            ? 'grid-outline'
                            : kind === 'kanban'
                              ? 'albums-outline'
                              : 'calendar-outline'
                    }
                    tone={selected ? 'primary' : 'default'}
                    size="lg"
                />
                <View className="gap-1 flex-1">
                    <Text className="font-sans-semibold text-foreground">{name}</Text>
                    {kind !== 'grid' ? (
                        <Text className="font-sans text-xs text-muted-foreground">
                            {t(kind === 'kanban' ? 'tables.view.kanban' : 'tables.view.calendar')}
                        </Text>
                    ) : null}
                </View>
                {selected ? <Icon name="checkmark" tone="primary" /> : null}
            </Pressable>
            {onEdit ? (
                <IconButton
                    size="lg"
                    icon="pencil-outline"
                    accessibilityLabel={t('tables.mobile.renameView') + ': ' + name}
                    onPress={onEdit}
                />
            ) : null}
            {onDelete ? (
                <IconButton
                    size="lg"
                    icon="trash-outline"
                    accessibilityLabel={t('tables.deleteView') + ': ' + name}
                    onPress={onDelete}
                />
            ) : null}
        </View>
    );
}
