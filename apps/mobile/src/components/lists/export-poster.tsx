import { Image, PixelRatio, Text, View } from 'react-native';
import type { ListExportTable } from '@/lib/lists/export-table';

export function ExportPoster({
    table,
    pixelExact = false,
}: {
    table: ListExportTable;
    pixelExact?: boolean;
}) {
    const scale = pixelExact ? 1 / PixelRatio.get() : 1;
    return (
        <View style={{ backgroundColor: '#ffffff', width: 1080 * scale, padding: 40 * scale }}>
            {table.cover ? (
                <Image
                    source={{ uri: table.cover }}
                    style={{ width: 1000 * scale, height: 320 * scale, marginBottom: 24 * scale }}
                />
            ) : null}
            <Text
                style={{
                    color: '#111111',
                    fontSize: 32 * scale,
                    fontFamily: 'Poppins_700Bold',
                    marginBottom: 24 * scale,
                }}
            >
                {table.title}
            </Text>
            {[table.headers, ...table.rows].map((row, index) => (
                <View
                    key={index}
                    style={{
                        flexDirection: 'row',
                        paddingVertical: 12 * scale,
                        backgroundColor: index % 2 ? '#f1f5f9' : '#ffffff',
                        borderBottomWidth: scale,
                        borderBottomColor: '#d1d5db',
                    }}
                >
                    {index > 0 && table.photos?.[index - 1] ? (
                        <Image
                            source={{ uri: table.photos[index - 1]! }}
                            style={{
                                width: 48 * scale,
                                height: 48 * scale,
                                marginRight: 8 * scale,
                            }}
                        />
                    ) : null}
                    {row.map((cell, column) => (
                        <Text
                            key={column}
                            style={{
                                flex: column === 0 ? 0.3 : 1,
                                paddingHorizontal: 8 * scale,
                                color: '#111111',
                                fontSize: 18 * scale,
                                fontFamily: index === 0 ? 'Poppins_700Bold' : 'Poppins_400Regular',
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
