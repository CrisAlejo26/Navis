import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChecklistBadge } from '@/components/teachings/checklist-badge';
import { AppBar } from '@/components/ui/app-bar';
import { formatDay } from '@/lib/format';
import { typeStyle } from '@/lib/ui/type-style';

interface TeachingDetailHeaderProps {
    title: string;
    receivedAt: string;
    checklist: { checked: number; total: number } | null;
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

/**
 * La cabecera de la ficha (RFC 0022 §3): una franja `accent/10` a todo el
 * ancho con el título como cabecera de página — no la tarjeta blanca y
 * centrada de profecías ni el retrato con degradado de sueños.
 */
export function TeachingDetailHeader({
    title,
    receivedAt,
    checklist,
    onShare,
    onEdit,
    onDelete,
}: TeachingDetailHeaderProps) {
    const { t } = useTranslation();

    return (
        <View className="rounded-b-3xl bg-accent/10">
            <AppBar
                transparent
                title=""
                actions={[
                    { icon: 'share-outline', label: t('teachings.export.share'), onPress: onShare },
                    { icon: 'create-outline', label: t('teachings.edit'), onPress: onEdit },
                    { icon: 'trash-outline', label: t('common.delete'), onPress: onDelete },
                ]}
            />
            <View className="gap-2 px-5 pb-6">
                <Text className="text-foreground" style={typeStyle('h1')}>
                    {title}
                </Text>
                <View className="gap-3 flex-row flex-wrap items-center">
                    <Text className="text-muted-foreground" style={typeStyle('caption')}>
                        {t('teachings.receivedOn', { date: formatDay(receivedAt) })}
                    </Text>
                    <ChecklistBadge checklist={checklist} />
                </View>
            </View>
        </View>
    );
}
