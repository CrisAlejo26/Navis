import { useEditMessage, useSendMessage, useUploadAttachment } from '@navis/api-client';
import type { Message } from '@navis/shared';
import { isFileMimeType, isImageMimeType, MAX_FILE_BYTES, MAX_IMAGE_BYTES } from '@navis/shared';
import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { wrapSelection, type ColorToken } from '@/lib/chat/message-format';
import { toast } from '@/lib/toast';

/**
 * Todo el estado y la lógica del compositor (RFC 0016 §6, RFC 0019 §1):
 * texto, adjunto, envío/edición y el envoltorio de formato/emoji sobre el
 * `Textarea`. `Composer` se queda solo con la vista (Regla 6).
 *
 * El `ref` del `Textarea` lo crea y lo pasa `Composer`, no este hook: un
 * objeto devuelto que mezclara un ref con estado normal hacía que el linter
 * de refs de React tratase **todo** ese objeto como «puede ser un ref» y
 * marcara como error leer `composer.body` o `composer.submit` en el render.
 */
export function useComposer({
  channelId,
  replyTo,
  onCancelReply,
  editing,
  onCancelEdit,
  textarea,
}: {
  channelId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
  editing: Message | null;
  onCancelEdit: () => void;
  textarea: RefObject<HTMLTextAreaElement | null>;
}) {
  const { t } = useTranslation();
  const [body, setBody] = useState(editing?.body ?? '');
  const [editingId, setEditingId] = useState(editing?.id ?? null);
  const [file, setFile] = useState<File | null>(null);

  const send = useSendMessage(api, channelId);
  const edit = useEditMessage(api);
  const upload = useUploadAttachment(api);

  // El formulario nace con el texto del mensaje cuando cambia cuál se edita
  // (Regla 1 §3): `setState` en un efecto para copiar props es un error de
  // lint, y aquí además se necesita justo al cambiar de mensaje, no en cada
  // pulsación. Los dos lados se comparan ya normalizados a `null`: sin el
  // `?? null` de la izquierda, `undefined !== null` es permanentemente
  // cierto en cuanto no se está editando nada, y el componente entra en un
  // bucle de renders infinito desde el primer render.
  const nextEditingId = editing?.id ?? null;
  if (nextEditingId !== editingId) {
    setEditingId(nextEditingId);
    setBody(editing?.body ?? '');
  }

  /** Envuelve la selección del `Textarea` (o inserta en el cursor si no hay ninguna). */
  function wrapAndFocus(before: string, after: string = before) {
    const el = textarea.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const result = wrapSelection(body, start, end, before, after);
    setBody(result.value);

    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  function insertColor(token: ColorToken) {
    wrapAndFocus(`{c:${token}}`, '{/c}');
  }

  function onFileChosen(chosen: File | undefined) {
    if (!chosen) return;

    const isImage = isImageMimeType(chosen.type);
    if (!isImage && !isFileMimeType(chosen.type)) {
      toast.error(t('errors.generic'));
      return;
    }
    if (chosen.size > (isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES)) {
      toast.error(t('errors.generic'));
      return;
    }

    setFile(chosen);
  }

  function submit() {
    const trimmed = body.trim();

    if (editing) {
      if (!trimmed) return;
      edit.mutate(
        { id: editing.id, body: trimmed },
        {
          onSuccess: () => {
            setBody('');
            onCancelEdit();
          },
        },
      );
      return;
    }

    if (file) {
      upload.mutate(
        {
          channelId,
          file,
          filename: file.name,
          body: trimmed || undefined,
          replyToId: replyTo?.id,
        },
        {
          onSuccess: () => {
            setBody('');
            setFile(null);
            onCancelReply();
          },
        },
      );
      return;
    }

    if (!trimmed) return;
    send.mutate(
      { body: trimmed, replyToId: replyTo?.id },
      {
        onSuccess: () => {
          setBody('');
          onCancelReply();
        },
      },
    );
  }

  return {
    body,
    setBody,
    file,
    setFile,
    pending: send.isPending || edit.isPending || upload.isPending,
    wrapAndFocus,
    insertColor,
    onFileChosen,
    submit,
  };
}
