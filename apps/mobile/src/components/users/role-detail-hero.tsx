import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoleRow } from '@navis/shared';

import { Icon } from '@/components/ui/icon';
import { hexShade } from '@/lib/color';

/** Una píldora blanca translúcida sobre el degradado: el dato va escrito, el color solo acompaña. */
function HeroTag({ text }: { text: string }) {
    return (
        <View
            style={{
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
            }}
        >
            <Text className="font-sans-semibold text-xs" style={{ color: '#ffffff' }}>
                {text}
            </Text>
        </View>
    );
}

/** La cabecera de la ficha de un rol: su color, su nombre y lo que dice de él. */
export function RoleDetailHero({
    role,
    label,
    hint,
    color,
}: {
    role: RoleRow;
    label: string;
    hint: string | null;
    color: string;
}) {
    const { t } = useTranslation();
    return (
        <LinearGradient
            colors={[hexShade(color, 0.85), hexShade(color, 0.5)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, padding: 22, alignItems: 'center', gap: 8 }}
        >
            <View
                aria-hidden
                style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    borderWidth: 2.5,
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon name="shield-checkmark-outline" size="lg" color="#ffffff" />
            </View>
            <Text
                className="font-sans-bold text-center"
                style={{ color: '#ffffff', fontSize: 24, marginTop: 6 }}
                accessibilityRole="header"
            >
                {label}
            </Text>
            {hint ? (
                <Text className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {hint}
                </Text>
            ) : null}
            <View className="flex-row flex-wrap justify-center" style={{ gap: 6, marginTop: 6 }}>
                <HeroTag text={role.isSystem ? t('roles.system') : t('roles.custom')} />
                <HeroTag text={`${t('roles.columnLevel')} ${String(role.level)}`} />
                <HeroTag text={`${t('roles.columnAccounts')} · ${String(role.usersCount)}`} />
            </View>
        </LinearGradient>
    );
}
