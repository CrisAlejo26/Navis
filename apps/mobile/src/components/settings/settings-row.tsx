import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { IoniconName } from '@/lib/nav-mobile';

interface SettingsRowProps {
    icon: IoniconName;
    title: string;
    subtitle?: string;
    /** Estado o valor a la derecha («Activados», «Español»). */
    value?: string;
    /** Sin él, la fila es informativa: ni chevron ni toque. */
    onPress?: () => void;
    /** Para las opciones de una hoja, donde el chevron sobra. */
    showChevron?: boolean;
    disabled?: boolean;
}

/**
 * La fila de un apartado de ajustes: icono en un recuadro tintado, título en
 * seminegrita, el valor a la derecha y el chevron cuando abre otra pantalla. Es
 * la fila de las tarjetas de `SettingsGroup`, que ponen los separadores.
 */
export function SettingsRow({
    icon,
    title,
    subtitle,
    value,
    onPress,
    showChevron = true,
    disabled = false,
}: SettingsRowProps) {
    const content = (
        <>
            <Icon name={icon} tone="primary" background="soft" shape="square" />
            <View className="min-w-0 gap-0.5 flex-1">
                <Text className="text-base font-sans-semibold text-foreground">{title}</Text>
                {subtitle ? (
                    <Text className="text-xs font-sans text-muted-foreground">{subtitle}</Text>
                ) : null}
            </View>
            {value ? (
                <Text className="text-sm font-sans shrink text-muted-foreground" numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            {onPress && showChevron ? <Icon name="chevron-forward" size="sm" /> : null}
        </>
    );

    const layout = 'min-h-14 flex-row items-center gap-3.5 py-3';
    if (!onPress) return <View className={layout}>{content}</View>;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            className={`${layout} active:opacity-70 ${disabled ? 'opacity-50' : ''}`}
        >
            {content}
        </Pressable>
    );
}
