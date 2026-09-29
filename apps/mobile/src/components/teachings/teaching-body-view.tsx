import type { TeachingBlock, TeachingBody } from '@navis/shared';
import { Text, View } from 'react-native';

import { ChecklistItem } from '@/components/teachings/checklist-item';
import { RichSpans } from '@/components/teachings/rich-spans';
import { paragraphsToRuns } from '@/lib/teachings/editor-model';
import { typeStyle } from '@/lib/ui/type-style';

interface TeachingBodyViewProps {
    body: TeachingBody;
    /** Recibe el número de tarea (en orden de documento). Sin él, solo lectura. */
    onToggleTask?: (index: number) => void;
}

/**
 * El cuerpo de una enseñanza, leído (RFC 0022 §3). Solo dibuja los nodos del
 * whitelist —nunca HTML—, y las tareas se pueden marcar desde aquí.
 */
export function TeachingBodyView({ body, onToggleTask }: TeachingBodyViewProps) {
    // El número de la primera tarea de cada bloque, contando las de los anteriores.
    const firstTasks = body.content.map((_, index) =>
        body.content
            .slice(0, index)
            .reduce(
                (total, block) => total + (block.type === 'taskList' ? block.content.length : 0),
                0,
            ),
    );

    return (
        <View className="gap-3">
            {body.content.map((block, index) => (
                <Block
                    key={index}
                    block={block}
                    firstTask={firstTasks[index] ?? 0}
                    onToggleTask={onToggleTask}
                />
            ))}
        </View>
    );
}

function Block({
    block,
    firstTask,
    onToggleTask,
}: {
    block: TeachingBlock;
    firstTask: number;
    onToggleTask?: (index: number) => void;
}) {
    if (block.type === 'paragraph') {
        return (
            <Text className="text-foreground" style={typeStyle('body')}>
                <RichSpans runs={paragraphsToRuns([block])} />
            </Text>
        );
    }

    if (block.type === 'taskList') {
        return (
            <View>
                {block.content.map((item, index) => (
                    <ChecklistItem
                        key={index}
                        runs={paragraphsToRuns(item.content)}
                        checked={item.attrs.checked}
                        onToggle={onToggleTask ? () => onToggleTask(firstTask + index) : undefined}
                    />
                ))}
            </View>
        );
    }

    return (
        <View className="gap-1.5">
            {block.content.map((item, index) => (
                <View key={index} className="gap-2 flex-row">
                    <Text className="w-6 text-muted-foreground" style={typeStyle('body')}>
                        {block.type === 'bulletList' ? '•' : `${String(index + 1)}.`}
                    </Text>
                    <Text className="min-w-0 flex-1 text-foreground" style={typeStyle('body')}>
                        <RichSpans runs={paragraphsToRuns(item.content)} />
                    </Text>
                </View>
            ))}
        </View>
    );
}
