import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';

interface AccountCardProps {
    name: string;
    email: string;
    /** El «puerto» de esta cuenta; sin iglesia activa no se pinta. */
    churchName?: string;
}

/**
 * Quién tiene la sesión abierta, arriba de los ajustes. La iglesia va como el
 * puerto de amarre del barco: es lo que distingue esta pantalla de la de
 * cualquier otra aplicación (Regla 9), y lo único que destaca en ella.
 */
export function AccountCard({ name, email, churchName }: AccountCardProps) {
    return (
        <View className="gap-4 rounded-3xl p-4 flex-row items-center bg-card">
            <Avatar name={name} size="xl" />
            <View className="min-w-0 gap-0.5 flex-1">
                <Text className="text-lg font-sans-semibold text-foreground" numberOfLines={2}>
                    {name}
                </Text>
                <Text className="text-sm font-sans text-muted-foreground" numberOfLines={1}>
                    {email}
                </Text>
                {churchName ? (
                    <View className="mt-1 gap-1.5 flex-row items-center">
                        <Icon name="boat-outline" size="sm" tone="primary" />
                        <Text
                            className="text-sm font-sans-semibold shrink text-primary"
                            numberOfLines={1}
                        >
                            {churchName}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}
