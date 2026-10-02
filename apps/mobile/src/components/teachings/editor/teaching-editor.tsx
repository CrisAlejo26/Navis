import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
    type TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { EditorBlockRow } from '@/components/teachings/editor/editor-block-row';
import { EditorToolbar } from '@/components/teachings/editor/editor-toolbar';
import type { BlockKind, EditorBlock } from '@/lib/teachings/editor-model';
import {
    backspaceAtStart,
    changeText,
    setKind,
    toggleChecked,
    type EditResult,
} from '@/lib/teachings/editor-ops';
import { cn } from '@/lib/cn';
import { PLAIN, styleAt, toggleMark, type Style } from '@/lib/teachings/runs';

interface TeachingEditorProps {
    blocks: EditorBlock[];
    onChange: (blocks: EditorBlock[]) => void;
    /** Título y fecha: van arriba, dentro del mismo desplazamiento. */
    header: ReactNode;
    /** Fijo bajo el desplazamiento y siempre a la vista: el botón de guardar. */
    footer: ReactNode;
}

interface Selection {
    id: string;
    start: number;
    end: number;
}

/** El número que le toca a cada bloque numerado: 1, 2, 3… mientras haya seguidos. */
function numbering(blocks: readonly EditorBlock[]): number[] {
    let n = 0;
    return blocks.map((block) => {
        n = block.kind === 'ordered' ? n + 1 : 0;
        return n;
    });
}

/**
 * La superficie de escritura (plan `ensenanzas-movil-plan.md` §4.4): la
 * cabecera y, debajo, el campo de las observaciones — una caja con borde y
 * etiqueta, como cualquier otro campo, con la barra de formato **dentro y
 * encima del texto**— y el pie fijo con el botón de guardar. Aquí solo está el
 * cableado —foco, cursor y estilo activo—; lo que le pasa al documento con cada
 * tecla es lógica pura de `lib/teachings/editor-ops.ts`.
 */
export function TeachingEditor({ blocks, onChange, header, footer }: TeachingEditorProps) {
    const { t } = useTranslation();
    const inputs = useRef(new Map<string, TextInput>());
    const pendingFocus = useRef<EditResult['focus'] | null>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    // El último bloque tocado: la barra actúa sobre él aunque el teclado se haya cerrado.
    const [lastId, setLastId] = useState<string | null>(null);
    const [selection, setSelection] = useState<Selection | null>(null);
    const [active, setActive] = useState<Style>(PLAIN);

    const current = blocks.find((block) => block.id === lastId) ?? blocks[0];

    // El foco nuevo (tras un Enter o una fusión) se pone cuando la fila ya existe.
    useEffect(() => {
        const target = pendingFocus.current;
        if (!target) return;
        pendingFocus.current = null;
        const input = inputs.current.get(target.id);
        input?.focus();
        input?.setSelection(target.caret, target.caret);
    }, [blocks]);

    function apply(result: EditResult | null, from: string) {
        if (!result) return;
        if (result.focus.id !== from || result.blocks.length !== blocks.length) {
            pendingFocus.current = result.focus;
        }
        onChange(result.blocks);
    }

    function toggleMarkOnSelection(mark: keyof Style) {
        if (!current) return;
        const range = selection?.id === current.id ? selection : null;
        if (!range || range.start === range.end) {
            setActive({ ...active, [mark]: !active[mark] });
            return;
        }
        const runs = toggleMark(current.runs, range.start, range.end, mark);
        onChange(blocks.map((block) => (block.id === current.id ? { ...block, runs } : block)));
    }

    function toggleKind(kind: Exclude<BlockKind, 'paragraph'>) {
        if (current) onChange(setKind(blocks, current.id, kind));
    }

    const numbers = numbering(blocks);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 16 }}
            >
                {header}
                <View className="gap-1.5">
                    <Text className="text-sm font-sans-medium text-foreground">
                        {t('teachings.notesField')}
                    </Text>
                    <View
                        className={cn(
                            'min-h-48 rounded-2xl overflow-hidden border-2 bg-card',
                            focusedId ? 'border-ring' : 'border-input',
                        )}
                    >
                        <EditorToolbar
                            style={active}
                            kind={current?.kind ?? 'paragraph'}
                            onToggleMark={toggleMarkOnSelection}
                            onToggleKind={toggleKind}
                        />
                        <View className="gap-0.5 px-3 py-1">
                            {blocks.map((block, index) => (
                                <EditorBlockRow
                                    key={block.id}
                                    ref={(input) => {
                                        if (input) inputs.current.set(block.id, input);
                                        else inputs.current.delete(block.id);
                                    }}
                                    block={block}
                                    number={numbers[index] ?? 1}
                                    placeholder={
                                        blocks.length === 1
                                            ? t('teachings.notesPlaceholder')
                                            : undefined
                                    }
                                    onFocus={() => {
                                        setFocusedId(block.id);
                                        setLastId(block.id);
                                    }}
                                    onBlur={() =>
                                        setFocusedId((id) => (id === block.id ? null : id))
                                    }
                                    onChangeText={(text) =>
                                        apply(changeText(blocks, block.id, text, active), block.id)
                                    }
                                    onSelectionChange={(start, end) => {
                                        setSelection({ id: block.id, start, end });
                                        if (start === end) setActive(styleAt(block.runs, start));
                                    }}
                                    onBackspaceAtStart={() =>
                                        apply(backspaceAtStart(blocks, block.id), block.id)
                                    }
                                    onToggleChecked={() =>
                                        onChange(toggleChecked(blocks, block.id))
                                    }
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
            {footer}
        </KeyboardAvoidingView>
    );
}
