import { Text, View } from 'react-native';

import { initials } from '@/components/ui/avatar';
import { hexAlpha, readableAccent } from '@/lib/color';
import { useUserPalette } from './user-theme';

/**
 * Las iniciales dentro de un anillo del color del rol: es lo que hace que un
 * listado de cuentas se lea por escalones antes de leer ninguna palabra. El
 * rol también va escrito al lado (`RoleBadge`), así que el color nunca informa
 * solo (Regla 3 §7).
 */
export function RoleAvatar({
    name,
    color,
    size = 54,
}: {
    name: string;
    color: string;
    size?: number;
}) {
    const p = useUserPalette();
    const ink = readableAccent(color, p.card, p.foreground, 0.16);
    return (
        <View
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2.5,
                borderColor: color,
                padding: 3,
            }}
        >
            <View
                style={{
                    flex: 1,
                    borderRadius: size / 2,
                    backgroundColor: hexAlpha(color, 0.16),
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text
                    className="font-sans-semibold"
                    style={{ color: ink, fontSize: Math.round(size * 0.3) }}
                >
                    {initials(name)}
                </Text>
            </View>
        </View>
    );
}
