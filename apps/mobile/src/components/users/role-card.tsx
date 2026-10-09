import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoleRow } from '@navis/shared';

import { Icon } from '@/components/ui/icon';
import { hexAlpha, readableAccent } from '@/lib/color';
import { listCardShadow } from '@/lib/ui/elevation';
import { useUserPalette } from './user-theme';

/** Una etiqueta de dato —tipo, nivel, cuentas— con la tinta que se lee sobre el tinte del rol. */
function Tag({ text, color }: { text: string; color: string }) {
    const p = useUserPalette();
    return (
        <View
            style={{
                borderRadius: 999,
                paddingVertical: 3,
                paddingHorizontal: 9,
                backgroundColor: hexAlpha(color, 0.14),
            }}
        >
            <Text
                className="font-sans-semibold text-xs"
                style={{ color: readableAccent(color, p.card, p.foreground, 0.14) }}
            >
                {text}
            </Text>
        </View>
    );
}

export function RoleCard({
    role,
    label,
    hint,
    color,
    onPress,
}: {
    role: RoleRow;
    label: string;
    hint: string | null;
    color: string;
    onPress: () => void;
}) {
    const p = useUserPalette(),
        { t } = useTranslation();
    return (
        <Pressable
            accessibilityRole="button"
            testID={`role-card-${role.slug}`}
            accessibilityLabel={`${label}, ${t('roles.columnLevel')} ${String(role.level)}`}
            onPress={onPress}
            style={[
                {
                    borderRadius: 26,
                    padding: 14,
                    marginBottom: 12,
                    flexDirection: 'row',
                    gap: 14,
                    borderWidth: 1,
                    borderColor: hexAlpha(color, p.dark ? 0.4 : 0.28),
                    backgroundColor: p.card,
                },
                listCardShadow(color, p.dark),
            ]}
        >
            <Icon
                name="shield-checkmark-outline"
                color={color}
                background="soft"
                containerSize={48}
                size="lg"
            />
            <View className="flex-1" style={{ gap: 4 }}>
                <Text
                    className="font-sans-semibold text-base text-foreground"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                >
                    {label}
                </Text>
                {hint ? (
                    <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                        {hint}
                    </Text>
                ) : null}
                <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 4 }}>
                    <Tag
                        text={role.isSystem ? t('roles.system') : t('roles.custom')}
                        color={color}
                    />
                    <Tag text={`${t('roles.columnLevel')} ${String(role.level)}`} color={color} />
                    <Tag
                        text={`${t('roles.columnAccounts')} · ${String(role.usersCount)}`}
                        color={color}
                    />
                </View>
            </View>
        </Pressable>
    );
}
