import type { CustomTableColumn } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Text, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { formatCell } from '@/lib/tables/format';
import { useThemeStore } from '@/lib/theme';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';

export const fieldIcons: Record<CustomTableColumn['type'], IoniconName> = {
    text: 'text-outline',
    long_text: 'document-text-outline',
    number: 'calculator-outline',
    currency: 'wallet-outline',
    checkbox: 'checkbox-outline',
    date: 'calendar-outline',
    single_select: 'pricetag-outline',
    multi_select: 'pricetags-outline',
    email: 'mail-outline',
    phone: 'call-outline',
    url: 'link-outline',
    password: 'lock-closed-outline',
};

export function RowValue({
    column,
    value,
    compact = false,
}: {
    column: CustomTableColumn;
    value: unknown;
    compact?: boolean;
}) {
    const theme = useThemeStore((state) => state.resolvedTheme);
    const values =
        column.type === 'single_select' && typeof value === 'string'
            ? [value]
            : column.type === 'multi_select' && Array.isArray(value)
              ? value.filter((one): one is string => typeof one === 'string')
              : [];
    if (values.length)
        return (
            <View className="gap-2 flex-row flex-wrap">
                {(compact ? values.slice(0, 3) : values).map((one) => {
                    const option = column.options?.find((item) => item.value === one);
                    const color = accentHex(option?.color ?? 'primary', theme);
                    return (
                        <View
                            key={one}
                            className="px-3 py-1.5 gap-2 flex-row items-center rounded-full"
                            style={{
                                maxWidth: '100%',
                                backgroundColor: hexAlpha(color, theme === 'dark' ? 0.2 : 0.09),
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: color,
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                }}
                            />
                            <Text
                                className="font-sans-medium text-sm flex-shrink text-foreground"
                                numberOfLines={compact ? 1 : undefined}
                            >
                                {option?.label ?? one}
                            </Text>
                        </View>
                    );
                })}
                {compact && values.length > 3 ? (
                    <Text className="font-sans text-sm text-muted-foreground">
                        +{values.length - 3}
                    </Text>
                ) : null}
            </View>
        );
    return (
        <View className="gap-2 flex-row items-start">
            {column.type === 'checkbox' && typeof value === 'boolean' ? (
                <Icon
                    name={value ? 'checkmark-circle' : 'ellipse-outline'}
                    tone={value ? 'success' : 'default'}
                    size="sm"
                />
            ) : null}
            <Text
                className={`font-sans text-foreground ${compact ? 'text-sm flex-shrink' : 'text-base leading-6 flex-1'}`}
                selectable={!compact}
                numberOfLines={compact ? 2 : undefined}
            >
                {formatCell(column, value)}
            </Text>
        </View>
    );
}
