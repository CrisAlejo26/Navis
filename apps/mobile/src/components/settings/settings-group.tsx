import { Children, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface SettingsGroupProps {
    label: string;
    children: ReactNode;
}

/**
 * Un apartado del concentrador: su etiqueta en mayúsculas y una tarjeta blanca
 * muy redondeada, sin borde, con un filete entre filas — el gesto de las
 * pantallas de ajustes de las apps hermanas (Taskia).
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
            <View className="rounded-3xl px-4 bg-card">
                {Children.toArray(children).map((child, i) => (
                    <View key={i} className={i > 0 ? 'border-t border-border' : undefined}>
                        {child}
                    </View>
                ))}
            </View>
        </View>
    );
}
