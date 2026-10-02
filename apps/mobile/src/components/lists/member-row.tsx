import type { ListMember } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';

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
        <View className="p-4 rounded-xl border border-border bg-card">
            <View className="gap-3 flex-row items-start">
                <View className="pt-2.5">
                    <Badge
                        label={String(index + 1)}
                        tone="primary"
                        className="min-w-8 justify-center"
                    />
                </View>
                <Pressable
                    disabled={!canManage}
                    accessibilityRole="button"
                    accessibilityLabel={t('lists.editNote', { name })}
                    onPress={onEdit}
                    className="py-2 gap-2 flex-1"
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
                    {member.hasAccess ? (
                        <View className="items-start">
                            <Badge
                                label={t('lists.hasListPermission')}
                                tone="success"
                                icon="key-outline"
                            />
                        </View>
                    ) : null}
                </Pressable>
                {canManage ? (
                    <View className="gap-2">
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
