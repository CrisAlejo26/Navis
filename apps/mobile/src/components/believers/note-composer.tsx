import { useState } from 'react';

import { NoteFormSheet } from '@/components/believers/note-form-sheet';
import { useAddAudio, useCreateNote } from '@/hooks/use-believers';

interface NoteComposerProps {
  believerId: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * La hoja de nota nueva para un creyente concreto. Los hooks de nota fijan el
 * creyente al montarse —no aceptan el identificador en la mutación—, así que
 * quien la use la monta **con `key` por creyente**: un montaje nuevo trae un
 * `useCreateNote` nuevo y ningún audio de otra persona se cuela.
 */
export function NoteComposer({ believerId, visible, onClose }: NoteComposerProps) {
  const [pendingAudios, setPendingAudios] = useState<
    { uri: string; durationSeconds: number | null }[]
  >([]);
  const createNote = useCreateNote(believerId);
  const addAudio = useAddAudio(believerId);

  return (
    <NoteFormSheet
      visible={visible}
      note={null}
      pendingAudios={pendingAudios}
      onRecorded={(audio) => setPendingAudios((previous) => [...previous, audio])}
      onClose={() => {
        setPendingAudios([]);
        onClose();
      }}
      onSave={async (values) => {
        const noteId = await createNote.mutateAsync(values);
        for (const audio of pendingAudios) {
          await addAudio.mutateAsync({
            noteId,
            audio: {
              sourceUri: audio.uri,
              mimeType: 'audio/mp4',
              sizeBytes: 0,
              durationSeconds: audio.durationSeconds,
              recorded: true,
            },
          });
        }
      }}
    />
  );
}
