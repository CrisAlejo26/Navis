import { Image, Text, View } from 'react-native';
import type { ListExportTable } from '@/lib/lists/export-table';

export function ExportPoster({ table }: { table: ListExportTable }) {
    return (
        <View style={{ backgroundColor: '#ffffff', width: 1080, padding: 40 }}>
            {table.cover ? (
                <Image
                    source={{ uri: table.cover }}
                    style={{ width: 1000, height: 320, marginBottom: 24 }}
                />
            ) : null}
            <Text
                style={{
                    color: '#111111',
                    fontSize: 32,
                    fontFamily: 'Roboto_700Bold',
                    marginBottom: 24,
                }}
            >
                {table.title}
            </Text>
            {[table.headers, ...table.rows].map((row, index) => (
                <View
                    key={index}
                    style={{
                        flexDirection: 'row',
                        paddingVertical: 12,
                        backgroundColor: index % 2 ? '#f1f5f9' : '#ffffff',
                        borderBottomWidth: 1,
                        borderBottomColor: '#d1d5db',
                    }}
                >
                    {index > 0 && table.photos?.[index - 1] ? (
                        <Image
                            source={{ uri: table.photos[index - 1]! }}
                            style={{ width: 48, height: 48, marginRight: 8 }}
                        />
                    ) : null}
                    {row.map((cell, column) => (
                        <Text
                            key={column}
                            style={{
                                flex: column === 0 ? 0.3 : 1,
                                paddingHorizontal: 8,
                                color: '#111111',
                                fontSize: 18,
                                fontFamily: index === 0 ? 'Roboto_700Bold' : 'Roboto_400Regular',
                            }}
                        >
                            {cell}
                        </Text>
                    ))}
                </View>
            ))}
        </View>
    );
}
