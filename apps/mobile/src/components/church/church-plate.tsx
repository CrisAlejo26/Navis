import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useLocalChurch } from '@/hooks/use-settings';
import { Icon } from '@/components/ui/icon';
import { ChurchBadge } from './church-badge';
import { ChurchSwitcherSheet } from './church-switcher-sheet';

export function ChurchPlate({ canSwitch = false }: { canSwitch?: boolean }) {
    const { t } = useTranslation();
    const { data: church } = useLocalChurch();
    const [open, setOpen] = useState(false);
    if (!church) return null;
    const content = (
        <>
            <ChurchBadge id={church.id} />
            <Text
                className="min-w-0 text-sm font-sans-semibold flex-1 text-foreground"
                numberOfLines={1}
            >
                {church.name}
            </Text>
            {canSwitch ? <Icon name="chevron-down" size="sm" /> : null}
        </>
    );
    const classes =
        'min-h-11 gap-2 px-2 py-1.5 rounded-2xl flex-row items-center border border-border bg-card';
    if (!canSwitch) return <View className={classes}>{content}</View>;
    return (
        <View className="min-w-0">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('church.switch')}: ${church.name}`}
                accessibilityState={{ expanded: open }}
                onPress={() => setOpen(true)}
                className={`${classes} active:opacity-80`}
            >
                {content}
            </Pressable>
            <ChurchSwitcherSheet visible={open} onClose={() => setOpen(false)} />
        </View>
    );
}
