import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { useState } from 'react';
import { Pressable, Text, View, type TextLayoutLine } from 'react-native';

import { RichSpans } from '@/components/teachings/rich-spans';
import { StrikeLine } from '@/components/teachings/strike-line';
import { useThemeStore } from '@/lib/theme';
import { typeStyle } from '@/lib/ui/type-style';
import { plainText, type Run } from '@/lib/teachings/runs';

interface ChecklistItemProps {
    runs: readonly Run[];
    checked: boolean;
    /** Sin él, la casilla es solo lectura (una vista previa). */
    onToggle?: () => void;
}

/**
 * Una tarea de la ficha de lectura: se marca con un toque, sin entrar en el
 * editor. La casilla y el texto son un único objetivo de al menos 44 pt; el
 * texto se tacha línea a línea con `StrikeLine`, midiendo dónde cae cada una
 * con `onTextLayout` (un texto que ocupa dos líneas no se tacha con una barra).
 */
export function ChecklistItem({ runs, checked, onToggle }: ChecklistItemProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const [lines, setLines] = useState<TextLayoutLine[]>([]);

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={plainText(runs)}
            accessibilityState={{ checked, disabled: !onToggle }}
            disabled={!onToggle}
            onPress={onToggle}
            className="min-h-11 gap-3 py-2 flex-row items-start active:opacity-70"
        >
            <View
                className="h-6 w-6 mt-px items-center justify-center rounded-md border-2"
                style={{
                    borderColor: checked ? palette.success : palette.mutedForeground,
                    backgroundColor: checked ? palette.success : 'transparent',
                }}
            >
                {checked ? (
                    <Ionicons name="checkmark" size={16} color={palette.successForeground} />
                ) : null}
            </View>
            <View className="min-w-0 flex-1">
                <Text
                    onTextLayout={(event) => setLines(event.nativeEvent.lines)}
                    className={checked ? 'text-muted-foreground' : 'text-foreground'}
                    style={typeStyle('body')}
                >
                    <RichSpans runs={runs} />
                </Text>
                {lines.map((line, index) => (
                    <StrikeLine
                        key={index}
                        x={line.x}
                        y={line.y + line.height / 2}
                        width={line.width}
                        checked={checked}
                        delay={index * 90}
                    />
                ))}
            </View>
        </Pressable>
    );
}
