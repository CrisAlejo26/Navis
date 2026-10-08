import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ListSummary, ListViewer } from '@navis/shared';

import { hexAlpha } from '@/lib/color';
import { formatMediumDate } from '@/lib/format';
import { listCardShadow } from '@/lib/ui/elevation';
import type { AccessStatus } from '@/lib/users/access-status';
import { ListPill, useAccessStatusDisplay } from './access-parts';
import { RoleAvatar } from './role-avatar';
import { RoleBadge } from './role-badge';
import { useUserPalette } from './user-theme';

export function AccessCard({
    viewer,
    lists,
    status,
    onPress,
}: {
    viewer: ListViewer;
    lists: readonly ListSummary[];
    status: AccessStatus;
    onPress: () => void;
}) {
    const p = useUserPalette(),
        { t } = useTranslation(),
        shown = useAccessStatusDisplay()(status),
        reached = lists.filter((one) => viewer.listIds.includes(one.id));
    return (
        <Pressable
            accessibilityRole="button"
            testID={`access-card-${viewer.username}`}
            accessibilityLabel={`${viewer.label}, ${viewer.username}, ${shown.label}`}
            onPress={onPress}
            style={[
                {
                    borderRadius: 26,
                    padding: 14,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: hexAlpha(shown.color, p.dark ? 0.4 : 0.28),
                    backgroundColor: p.card,
                    opacity: status === 'active' ? 1 : 0.8,
                },
                listCardShadow(shown.color, p.dark),
            ]}
        >
            <RoleAvatar name={viewer.label} color={shown.color} />
            <View className="flex-1" style={{ gap: 3 }}>
                <Text className="font-sans-semibold text-base text-foreground" numberOfLines={1}>
                    {viewer.label}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {viewer.username}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {viewer.lastSeenAt
                        ? `${t('roles.accessLastSeen')} · ${formatMediumDate(new Date(viewer.lastSeenAt))}`
                        : t('lists.neverEnteredShort')}
                </Text>
                <View className="flex-row flex-wrap items-center" style={{ gap: 6, marginTop: 4 }}>
                    <RoleBadge label={shown.label} color={shown.color} />
                    {reached.map((list) => (
                        <ListPill key={list.id} list={list} />
                    ))}
                    {reached.length === 0 ? (
                        <Text className="text-xs text-muted-foreground">{t('lists.noLists')}</Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}
