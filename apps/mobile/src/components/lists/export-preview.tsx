import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';
import type { ListExportTable } from '@/lib/lists/export-table';

/** Usa las mismas filas que recibe el generador de archivos. */
export function ExportPreview({
    table,
    showPhotos,
}: {
    table: ListExportTable;
    showPhotos: boolean;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-2 p-3 rounded-xl border border-border bg-card">
            <Text className="text-sm font-sans-semibold text-foreground">
                {t('lists.exportPreview')}
            </Text>
            {table.rows.length ? (
                <ScrollView horizontal>
                    <View>
                        {[table.headers, ...table.rows.slice(0, 3)].map((row, index) => (
                            <View
                                key={index}
                                className="py-3 gap-3 flex-row items-start border-b border-border"
                            >
                                {showPhotos ? (
                                    <View style={{ width: 40 }}>
                                        {index > 0 && table.photos?.[index - 1] ? (
                                            <Image
                                                source={{ uri: table.photos[index - 1]! }}
                                                style={{ width: 40, height: 40, borderRadius: 20 }}
                                            />
                                        ) : null}
                                    </View>
                                ) : null}
                                {row.map((cell, column) => (
                                    <Text
                                        key={column}
                                        style={{ width: column === 0 ? 44 : 160 }}
                                        className={
                                            index === 0
                                                ? 'text-xs font-sans-semibold text-muted-foreground'
                                                : 'text-sm text-foreground'
                                        }
                                    >
                                        {cell}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <Text className="text-sm text-muted-foreground">{t('lists.emptyList')}</Text>
            )}
            {table.rows.length > 3 ? (
                <Text className="text-xs text-muted-foreground">
                    {t('lists.exportPreviewRows', { count: table.rows.length })}
                </Text>
            ) : null}
        </View>
    );
}
