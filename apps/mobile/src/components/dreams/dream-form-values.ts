import type { CreateDreamInput } from '@navis/shared';

import type { LocalDream } from '@/data/repos/dreams-repo';
import { todayIso } from '@/data/repos/dashboard-repo';

/**
 * El estado y la validación del formulario de sueño, **sin React**: por eso
 * vive aparte de la hoja — lo prueban los tests sin montar `expo-audio`.
 */

export interface PendingAudio {
    uri: string;
    durationSeconds: number | null;
}

export interface DreamFormValues {
    title: string;
    body: string;
    dreamedAt: string;
    interpretation: string;
    emotionIds: string[];
    /** Grabados con la hoja abierta: se copian al guardar, como en las notas. */
    pendingAudios: PendingAudio[];
}

export function emptyDreamForm(): DreamFormValues {
    return {
        title: '',
        body: '',
        // La noche de hoy, que es la que se apunta al despertar (D17).
        dreamedAt: todayIso(),
        interpretation: '',
        emotionIds: [],
        pendingAudios: [],
    };
}

export function dreamFormFrom(dream: LocalDream): DreamFormValues {
    return {
        title: dream.title ?? '',
        body: dream.body,
        dreamedAt: dream.dreamedAt,
        interpretation: dream.interpretation ?? '',
        emotionIds: dream.emotions.map((one) => one.id),
        pendingAudios: [],
    };
}

/** Solo el cuerpo es obligatorio (D17). */
export function isDreamFormValid(values: DreamFormValues): boolean {
    return values.body.trim().length > 0;
}

export function toDreamInput(values: DreamFormValues): CreateDreamInput {
    return {
        title: values.title,
        body: values.body,
        dreamedAt: values.dreamedAt,
        interpretation: values.interpretation,
        emotionIds: values.emotionIds,
    };
}
