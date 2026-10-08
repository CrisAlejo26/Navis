import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@navis/shared';

import { hexAlpha } from '@/lib/color';
import { formatMediumDate } from '@/lib/format';
import { listCardShadow } from '@/lib/ui/elevation';
import { RoleAvatar } from './role-avatar';
import { RoleBadge } from './role-badge';
import { useUserPalette } from './user-theme';

export function UserCard({
    user,
    roleLabel,
    color,
    isMe,
    onPress,
}: {
    user: ManagedUser;
    roleLabel: string;
    color: string;
    isMe: boolean;
    onPress: () => void;
}) {
    const p = useUserPalette(),
        { t } = useTranslation();
    return (
        <Pressable
            accessibilityRole="button"
            testID={`user-card-${user.email}`}
            onPress={onPress}
            accessibilityLabel={`${user.name}, ${roleLabel}, ${user.email}`}
            style={[
                {
                    borderRadius: 26,
                    padding: 14,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: hexAlpha(color, p.dark ? 0.4 : 0.28),
                    backgroundColor: p.card,
                },
                listCardShadow(color, p.dark),
            ]}
        >
            <RoleAvatar name={user.name} color={color} />
            <View className="flex-1" style={{ gap: 3 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text
                        className="font-sans-semibold text-base shrink text-foreground"
                        numberOfLines={1}
                    >
                        {user.name}
                    </Text>
                    {isMe && (
                        <Text className="font-sans-semibold text-xs" style={{ color: p.primary }}>
                            {t('roles.you')}
                        </Text>
                    )}
                </View>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {user.email}
                </Text>
                <View className="flex-row flex-wrap items-center" style={{ gap: 8, marginTop: 4 }}>
                    <RoleBadge label={roleLabel} color={color} />
                    <Text className="text-xs text-muted-foreground">
                        {t('roles.joinedOn', { date: formatMediumDate(user.createdAt) })}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
