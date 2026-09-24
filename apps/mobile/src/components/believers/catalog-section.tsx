import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { ListRow } from '@/components/ui/list-row';

export interface CatalogEntry {
    id: string;
    name: string;
    isSystem: boolean;
    isActive: boolean;
}

/**
 * La lista de un catálogo (dones, labores, etiquetas), con el patrón de
 * Notion «Edit property»: cada fila se renombra al pulsarla, se enciende o
 * se apaga con el ojo y **solo se borra lo que no es de serie** — los de
 * serie son el suelo común del vocabulario (RFC 0003 D5).
 */
export function CatalogSection({
    entries,
    emptyText,
    deleteTitle,
    deleteBody,
    onEdit,
    onToggle,
    onDelete,
}: {
    entries: CatalogEntry[];
    emptyText: string;
    deleteTitle: (name: string) => string;
    deleteBody: string;
    onEdit: (entry: CatalogEntry) => void;
    onToggle: (entry: CatalogEntry) => void;
    onDelete: (entry: CatalogEntry) => void;
}) {
    const { t } = useTranslation();

    if (entries.length === 0) {
        return <Text className="py-4 text-sm text-center text-muted-foreground">{emptyText}</Text>;
    }

    function confirmDelete(entry: CatalogEntry) {
        Alert.alert(deleteTitle(entry.name), deleteBody, [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(entry) },
        ]);
    }

    return (
        <View className="rounded-2xl border border-border bg-card">
            {entries.map((entry, index) => (
                <View key={entry.id} className={index > 0 ? 'border-t border-border' : ''}>
                    <ListRow
                        title={entry.name}
                        leading={
                            entry.isActive ? undefined : (
                                <Badge label={t('gifts.inactive')} tone="warning" />
                            )
                        }
                        trailing={
                            <View className="gap-1 flex-row items-center">
                                {entry.isSystem ? (
                                    <Text className="text-[10px] text-muted-foreground uppercase">
                                        {t('gifts.system')}
                                    </Text>
                                ) : null}
                                <IconButton
                                    icon={entry.isActive ? 'eye-outline' : 'eye-off-outline'}
                                    accessibilityLabel={t(
                                        entry.isActive ? 'gifts.deactivate' : 'gifts.activate',
                                    )}
                                    onPress={() => onToggle(entry)}
                                />
                                {!entry.isSystem ? (
                                    <IconButton
                                        icon="trash-outline"
                                        accessibilityLabel={t('common.delete')}
                                        onPress={() => confirmDelete(entry)}
                                    />
                                ) : null}
                            </View>
                        }
                        onPress={() => onEdit(entry)}
                    />
                </View>
            ))}
        </View>
    );
}
