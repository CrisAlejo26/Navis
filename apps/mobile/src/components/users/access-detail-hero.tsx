import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import type { ListViewer } from '@navis/shared';

import { hexShade } from '@/lib/color';
import { RoleAvatar } from './role-avatar';

/** La cabecera de la ficha de un acceso: su color es el de su estado, y el estado va escrito. */
export function AccessDetailHero({
    viewer,
    statusLabel,
    color,
}: {
    viewer: ListViewer;
    statusLabel: string;
    color: string;
}) {
    return (
        <LinearGradient
            colors={[hexShade(color, 0.85), hexShade(color, 0.5)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, padding: 22, alignItems: 'center', gap: 6 }}
        >
            <RoleAvatar name={viewer.label} color={color} size={92} onScene />
            <Text
                className="font-sans-bold text-center"
                style={{ color: '#ffffff', fontSize: 24, marginTop: 8 }}
                accessibilityRole="header"
            >
                {viewer.label}
            </Text>
            <Text className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {viewer.username}
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
                    {statusLabel}
                </Text>
            </View>
        </LinearGradient>
    );
}
