import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { themeColorsHex } from '@navis/theme';
import { useThemeStore } from '@/lib/theme';
import { elevation } from '@/lib/ui/elevation';

interface CardProps {
    title?: string;
    description?: string;
    children?: ReactNode;
    className?: string;
}

export function Card({ title, description, children, className }: CardProps) {
    const theme = useThemeStore((state) => state.resolvedTheme);
    return (
        <View
            style={elevation('card', themeColorsHex[theme].foreground, theme === 'dark')}
            className={cn('gap-2 p-4 rounded-xl border border-border bg-card', className)}
        >
            {title ? (
                <Text className="text-base font-sans-semibold text-foreground">{title}</Text>
            ) : null}
            {description ? (
                <Text className="text-sm font-sans text-muted-foreground">{description}</Text>
            ) : null}
            {children}
        </View>
    );
}
