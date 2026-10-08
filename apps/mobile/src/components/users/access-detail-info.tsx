import { Text, View } from 'react-native';

/** Datos en filas «etiqueta / valor»: lo que la cabecera no dice. Las filas sin valor no salen. */
export function AccessDetailInfo({ rows }: { rows: { label: string; value: string | null }[] }) {
    return (
        <View className="gap-3 rounded-3xl p-4 bg-card">
            {rows
                .filter((row) => row.value)
                .map((row) => (
                    <View key={row.label} className="gap-1">
                        <Text className="font-sans-semibold text-xs text-muted-foreground uppercase">
                            {row.label}
                        </Text>
                        <Text selectable className="text-base text-foreground">
                            {row.value}
                        </Text>
                    </View>
                ))}
        </View>
    );
}
