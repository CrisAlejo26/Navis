import { Ionicons } from '@expo/vector-icons';
import { FONT_FAMILIES, themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { BlockKind } from '@/lib/teachings/editor-model';
import type { Style } from '@/lib/teachings/runs';
import { useThemeStore } from '@/lib/theme';

interface EditorToolbarProps {
    /** El estilo con el que se escribiría ahora mismo (negrita, cursiva). */
    style: Style;
    /** El tipo del bloque donde está el cursor. */
    kind: BlockKind;
    onToggleMark: (mark: keyof Style) => void;
    onToggleKind: (kind: Exclude<BlockKind, 'paragraph'>) => void;
}

interface ToolProps {
    label: string;
    active: boolean;
    onPress: () => void;
    children: React.ReactNode;
}

function Tool({ label, active, onPress, children }: ToolProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={onPress}
            className={`h-11 w-11 items-center justify-center rounded-xl active:opacity-60 ${active ? 'bg-primary/15' : ''}`}
        >
            {children}
        </Pressable>
    );
}

/**
 * La barra de formato, dentro del campo y justo encima del texto que se escribe
 * (revisión de uso: pegada al teclado no se entendía sobre qué actuaba): negrita
 * y cursiva a la izquierda y las tres listas después. Sin cruces (Regla 7).
 */
export function EditorToolbar({ style, kind, onToggleMark, onToggleKind }: EditorToolbarProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const tone = (active: boolean) => (active ? palette.primary : palette.foreground);

    return (
        <View className="gap-1 px-2 py-1 flex-row items-center border-b border-border">
            <Tool
                label={t('teachings.editor.bold')}
                active={style.bold}
                onPress={() => onToggleMark('bold')}
            >
                <Text
                    style={{
                        fontFamily: FONT_FAMILIES.sansBold.native,
                        fontSize: 18,
                        color: tone(style.bold),
                    }}
                >
                    B
                </Text>
            </Tool>
            <Tool
                label={t('teachings.editor.italic')}
                active={style.italic}
                onPress={() => onToggleMark('italic')}
            >
                <Text
                    style={{
                        fontFamily: FONT_FAMILIES.sansItalic.native,
                        fontSize: 18,
                        color: tone(style.italic),
                    }}
                >
                    I
                </Text>
            </Tool>
            <View className="mx-1 h-6 w-px bg-border" />
            <Tool
                label={t('teachings.editor.bulletList')}
                active={kind === 'bullet'}
                onPress={() => onToggleKind('bullet')}
            >
                <Ionicons name="list" size={22} color={tone(kind === 'bullet')} />
            </Tool>
            <Tool
                label={t('teachings.editor.orderedList')}
                active={kind === 'ordered'}
                onPress={() => onToggleKind('ordered')}
            >
                <Text
                    style={{
                        fontFamily: FONT_FAMILIES.sansBold.native,
                        fontSize: 15,
                        color: tone(kind === 'ordered'),
                    }}
                >
                    1.
                </Text>
            </Tool>
            <Tool
                label={t('teachings.editor.taskList')}
                active={kind === 'task'}
                onPress={() => onToggleKind('task')}
            >
                <Ionicons name="checkbox-outline" size={22} color={tone(kind === 'task')} />
            </Tool>
        </View>
    );
}
