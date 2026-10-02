import type { ListMember } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { IconButton } from '@/components/ui/icon-button';

export function MemberRow({
    member,
    index,
    total,
    canManage,
    busy,
    onEdit,
    onMove,
}: {
    member: ListMember;
    index: number;
    total: number;
    canManage: boolean;
    busy: boolean;
    onEdit: () => void;
    onMove: (direction: number) => void;
}) {
    const { t } = useTranslation();
    const name = `${member.firstName} ${member.lastName}`;
    return (
        <View className="gap-2 p-3 rounded-xl border border-border bg-card">
            <View className="gap-2 flex-row items-center">
                <Text className="text-sm text-muted-foreground">{index + 1}</Text>
                <Pressable
                    disabled={!canManage}
                    accessibilityRole="button"
                    accessibilityLabel={t('lists.editNote', { name })}
                    onPress={onEdit}
                    className="py-2 flex-1"
                >
                    <Text className="text-base font-sans-medium text-foreground">{name}</Text>
                    {member.congregationName ? (
                        <Text className="text-sm text-muted-foreground">
                            {member.congregationName}
                        </Text>
                    ) : null}
                    {member.ministries.length ? (
                        <Text className="text-sm text-muted-foreground">
                            {member.ministries.join(' · ')}
                        </Text>
                    ) : null}
                    {member.note ? (
                        <Text className="text-sm text-foreground">{member.note}</Text>
                    ) : null}
                </Pressable>
                {canManage ? (
                    <View>
                        <IconButton
                            size="lg"
                            icon="chevron-up"
                            accessibilityLabel={t('lists.moveUp', { name })}
                            disabled={index === 0 || busy}
                            onPress={() => onMove(-1)}
                        />
                        <IconButton
                            size="lg"
                            icon="chevron-down"
                            accessibilityLabel={t('lists.moveDown', { name })}
                            disabled={index === total - 1 || busy}
                            onPress={() => onMove(1)}
                        />
                    </View>
                ) : null}
            </View>
        </View>
    );
}
