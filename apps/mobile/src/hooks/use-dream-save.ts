import { toDreamInput, type DreamFormValues } from '@/components/dreams/dream-form-values';
import { useAddDreamAudio, useCreateDream, useUpdateDream } from '@/hooks/use-dreams';

/**
 * Guardar el formulario de sueño, sea nuevo o no: crea o actualiza, y después
 * copia los audios grabados con la hoja abierta (lo mismo que hace la bitácora
 * de creyentes con las notas). Lo comparten la portada, el listado y la ficha:
 * los tres abren el mismo formulario y ninguno debe saber cómo se guarda.
 */
export function useSaveDream(): (values: DreamFormValues, id: string | null) => Promise<void> {
    const create = useCreateDream();
    const update = useUpdateDream();
    const addAudio = useAddDreamAudio();

    return async (values, id) => {
        const input = toDreamInput(values);
        let dreamId = id;
        if (dreamId) await update.mutateAsync({ id: dreamId, input });
        else dreamId = await create.mutateAsync(input);

        for (const audio of values.pendingAudios) {
            await addAudio.mutateAsync({
                dreamId,
                audio: {
                    sourceUri: audio.uri,
                    mimeType: 'audio/mp4',
                    sizeBytes: 0,
                    durationSeconds: audio.durationSeconds,
                    recorded: true,
                },
            });
        }
    };
}
