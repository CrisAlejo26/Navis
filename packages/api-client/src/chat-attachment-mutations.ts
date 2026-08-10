import type { Message } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

export interface AttachmentUpload {
  channelId: string;
  file: Blob;
  /** El nombre solo viaja para el `multipart`; el servidor pone el suyo. */
  filename: string;
  body?: string;
  replyToId?: string;
}

/**
 * Subir un adjunto va por `FormData` y **sin** `content-type` a mano, como
 * `useUploadNoteAudio`: el navegador tiene que escribirlo él para incluir el
 * `boundary` del multipart.
 */
export function useUploadAttachment(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, file, filename, body, replyToId }: AttachmentUpload) => {
      const form = new FormData();
      form.append('file', file, filename);
      if (body) form.append('body', body);
      if (replyToId) form.append('replyToId', replyToId);

      return api.post<Message>(`/channels/${channelId}/attachments`, undefined, { body: form });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.chat.all }),
  });
}
