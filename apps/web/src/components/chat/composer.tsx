import { useEditMessage, useSendMessage, useUploadAttachment } from '@navis/api-client';
import type { Message } from '@navis/shared';
import { isFileMimeType, isImageMimeType, MAX_FILE_BYTES, MAX_IMAGE_BYTES } from '@navis/shared';
import { Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ComposerAttachment } from './composer-attachment';

/** Texto + adjuntar + vista previa antes de enviar (RFC 0016 §6). */
export function Composer({
  channelId,
  disabled,
  replyTo,
  onCancelReply,
  editing,
  onCancelEdit,
  onTyping,
}: {
  channelId: string;
  disabled?: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
  editing: Message | null;
  onCancelEdit: () => void;
  onTyping: () => void;
}) {
  const { t } = useTranslation();
  const [body, setBody] = useState(editing?.body ?? '');
  const [editingId, setEditingId] = useState(editing?.id ?? null);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const pending = send.isPending || edit.isPending || upload.isPending;

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

  return (
    <div className="p-3 border-t bg-card">
      {replyTo && !editing && (
        <div className="p-2 mb-2 gap-2 flex items-start rounded-lg border-l-2 border-primary bg-muted">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary">{replyTo.authorName}</p>
            <p className="text-xs line-clamp-1 text-muted-foreground">
              {replyTo.deletedAt ? t('communications.deletedMessage') : replyTo.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t('common.close')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
      )}

      {editing && (
        <div className="p-2 mb-2 gap-2 flex items-center rounded-lg border-l-2 border-primary bg-muted">
          <p className="text-xs font-medium flex-1 text-primary">{t('common.edit')}</p>
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              setBody('');
            }}
            aria-label={t('common.close')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
      )}

      {file && <ComposerAttachment file={file} onRemove={() => setFile(null)} />}

      <div className="gap-2 flex items-end">
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(event) => {
            onFileChosen(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {!editing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={t('communications.attachFile')}
            onClick={() => fileInput.current?.click()}
          >
            <Paperclip size={18} aria-hidden />
          </Button>
        )}

        <Textarea
          aria-label={t('communications.messagePlaceholder')}
          className="min-h-11 max-h-40 py-2.5"
          rows={1}
          value={body}
          disabled={disabled}
          placeholder={t('communications.messagePlaceholder')}
          onChange={(event) => {
            setBody(event.target.value);
            onTyping();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />

        {/* 48 px: es la acción principal de una pantalla táctil (Regla 5 §4). */}
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 shrink-0"
          isLoading={pending}
          disabled={disabled || (!body.trim() && !file)}
          aria-label={t(editing ? 'common.save' : 'communications.messagePlaceholder')}
          onClick={submit}
        >
          <Send size={18} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
