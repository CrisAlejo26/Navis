import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';

interface AccountCardProps {
    name: string;
    email: string;
    label: string;
    onPress: () => void;
}

/**
 * La identidad y el acceso al perfil comparten un único objetivo táctil.
 */
export function AccountCard({ name, email, label, onPress }: AccountCardProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            className="gap-3.5 p-4 flex-row items-center rounded-[26px] bg-card active:opacity-70"
        >
            <Avatar name={name} size="lg" />
            <View className="min-w-0 gap-0.5 flex-1">
                <Text className="text-lg font-sans-semibold text-foreground" numberOfLines={2}>
                    {name}
                </Text>
                <Text className="text-sm font-sans text-muted-foreground" numberOfLines={1}>
                    {email}
                </Text>
                <Text className="mt-1 text-xs font-sans-medium text-primary">{label}</Text>
            </View>
            <Icon name="chevron-forward" size="sm" />
        </Pressable>
    );
}
