import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkflowRef } from '@navis/shared';
import { hexAlpha, readableAccent } from '@/lib/color';
import { useTaskPalette } from './task-theme';

/**
 * El flujo de una tarea (Fase 7b): su brújula y su color, con el nombre
 * escrito (Regla 3 §7). Otro icono que el de la etiqueta, para no confundirse.
 */
export function TaskWorkflowBadge({
    workflow,
}: {
    workflow: Pick<WorkflowRef, 'name' | 'accent'>;
}) {
    const p = useTaskPalette(),
        accent = p.accent(workflow.accent),
        color = readableAccent(accent, p.card, p.foreground);
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 4,
                backgroundColor: hexAlpha(accent, 0.12),
            }}
        >
            <Ionicons name="compass-outline" size={12} color={color} aria-hidden />
            <Text className="font-sans-medium text-xs" style={{ color }}>
                {workflow.name}
            </Text>
        </View>
    );
}
