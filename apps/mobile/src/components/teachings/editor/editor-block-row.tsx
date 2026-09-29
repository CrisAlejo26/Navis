import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { forwardRef, useRef } from 'react';
import {
    Pressable,
    Text,
    TextInput,
    View,
    type NativeSyntheticEvent,
    type TextInputKeyPressEventData,
    type TextInputSelectionChangeEventData,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { RichSpans } from '@/components/teachings/rich-spans';
import type { EditorBlock } from '@/lib/teachings/editor-model';
import { useThemeStore } from '@/lib/theme';
import { typeStyle } from '@/lib/ui/type-style';

/** El aire sobre y bajo el texto de una fila: el marcador se alinea con él. */
const LINE_PADDING = 8;

interface EditorBlockRowProps {
    block: EditorBlock;
    /** Solo en las numeradas: el número que toca (1, 2, 3…). */
    number: number;
    placeholder?: string;
    onFocus: () => void;
    onBlur: () => void;
    onChangeText: (text: string) => void;
    onSelectionChange: (start: number, end: number) => void;
    onBackspaceAtStart: () => void;
    onToggleChecked: () => void;
}

/**
 * Una fila del editor: el marcador (viñeta, número o casilla) y un
 * `TextInput` cuyos hijos son los tramos con formato. **No se le pasa
 * `value`**: el texto lo mandan los hijos, y así el cursor no salta cuando
 * cambia el formato de un tramo (plan `ensenanzas-movil-plan.md` §8).
 */
export const EditorBlockRow = forwardRef<TextInput, EditorBlockRowProps>(function EditorBlockRow(
    {
        block,
        number,
        placeholder,
        onFocus,
        onBlur,
        onChangeText,
        onSelectionChange,
        onBackspaceAtStart,
        onToggleChecked,
    },
    ref,
) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const selection = useRef({ start: 0, end: 0 });

    function trackSelection(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
        const { start, end } = event.nativeEvent.selection;
        selection.current = { start, end };
        onSelectionChange(start, end);
    }

    function handleKey(event: NativeSyntheticEvent<TextInputKeyPressEventData>) {
        if (
            event.nativeEvent.key === 'Backspace' &&
            selection.current.start === 0 &&
            selection.current.end === 0
        ) {
            onBackspaceAtStart();
        }
    }

    return (
        <View className="min-h-11 gap-2 flex-row items-start">
            {block.kind === 'task' ? (
                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: block.checked }}
                    accessibilityLabel={t('teachings.editor.taskList')}
                    onPress={onToggleChecked}
                    hitSlop={8}
                    className="h-6 w-6 items-center justify-center rounded-md border-2"
                    style={{
                        // Centrada en la primera línea (22 pt) del campo, que arranca a 8 pt.
                        marginTop: 7,
                        borderColor: block.checked ? palette.success : palette.mutedForeground,
                        backgroundColor: block.checked ? palette.success : 'transparent',
                    }}
                >
                    {block.checked ? (
                        <Ionicons name="checkmark" size={16} color={palette.successForeground} />
                    ) : null}
                </Pressable>
            ) : block.kind === 'paragraph' ? null : (
                <Text
                    className="w-6 text-muted-foreground"
                    style={[
                        typeStyle('body'),
                        { paddingTop: LINE_PADDING, includeFontPadding: false },
                    ]}
                >
                    {block.kind === 'bullet' ? '•' : `${String(number)}.`}
                </Text>
            )}
            <TextInput
                ref={ref}
                multiline
                scrollEnabled={false}
                onFocus={onFocus}
                onBlur={onBlur}
                onChangeText={onChangeText}
                onSelectionChange={trackSelection}
                onKeyPress={handleKey}
                placeholder={placeholder}
                placeholderTextColor={palette.mutedForeground}
                selectionColor={palette.primary}
                accessibilityLabel={t('teachings.notesField')}
                className="min-w-0 flex-1 text-foreground"
                style={[
                    typeStyle('body'),
                    {
                        textAlignVertical: 'top',
                        padding: 0,
                        paddingVertical: LINE_PADDING,
                        includeFontPadding: false,
                    },
                ]}
            >
                <RichSpans runs={block.runs} />
            </TextInput>
        </View>
    );
});
