import { Children, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SettingsGroupProps {
    label: string;
    children: ReactNode;
}

/**
 * Apartado compacto con superficie diferenciada y separadores entre filas.
 */
export function SettingsGroup({ label, children }: SettingsGroupProps) {
    return (
        <View className="gap-2.5">
            <Text
                accessibilityRole="header"
                className="px-1 text-xs font-sans-semibold tracking-wider text-muted-foreground uppercase"
            >
                {label}
            </Text>
            <View className="px-4 rounded-[26px] bg-card">
                {Children.toArray(children).map((child, i) => (
                    <View key={i} className={i > 0 ? 'border-t border-border/60' : undefined}>
                        {child}
                    </View>
                ))}
            </View>
        </View>
    );
}
