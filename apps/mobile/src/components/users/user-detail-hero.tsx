import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import type { ManagedUser } from '@navis/shared';

import { readableGradient } from '@/lib/color';
import { RoleAvatar } from './role-avatar';

/**
 * La cabecera de la ficha: el degradado del color del rol, con la persona en
 * grande. El rol va escrito debajo del nombre, no solo en el color (Regla 3 §7).
 */
export function UserDetailHero({
    user,
    roleLabel,
    color,
}: {
    user: ManagedUser;
    roleLabel: string;
    color: string;
}) {
    return (
        <LinearGradient
            colors={readableGradient(color)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, padding: 22, alignItems: 'center', gap: 6 }}
        >
            <RoleAvatar name={user.name} color={color} size={92} onScene />
            <Text
                className="font-sans-bold text-center"
                style={{ color: '#ffffff', fontSize: 24, marginTop: 8 }}
                accessibilityRole="header"
            >
                {user.name}
            </Text>
            <Text className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {user.email}
            </Text>
            <View
                style={{
                    marginTop: 8,
                    borderRadius: 999,
                    paddingVertical: 5,
                    paddingHorizontal: 14,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                }}
            >
                <Text className="font-sans-semibold text-sm" style={{ color: '#ffffff' }}>
                    {roleLabel}
                </Text>
            </View>
        </LinearGradient>
    );
}
