import type { Message } from '@navis/shared';
import { Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useComposer } from '@/lib/chat/use-composer';
import { ComposerAttachment } from './composer-attachment';
import { ComposerPreview } from './composer-preview';
import { ComposerTools } from './composer-tools';
import { FormatToolbar } from './format-toolbar';

/** Texto + adjuntar + vista previa antes de enviar (RFC 0016 §6, RFC 0019 §1). */
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
  const [formatOpen, setFormatOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const composer = useComposer({
    channelId,
    replyTo,
    onCancelReply,
    editing,
    onCancelEdit,
    textarea,
  });

  return (
    <div className="p-3 border-t bg-card">
      <ComposerPreview
        replyTo={replyTo}
        editing={editing}
        onCancelReply={onCancelReply}
        onCancelEdit={() => {
          onCancelEdit();
          composer.setBody('');
        }}
      />

      {composer.file && (
        <ComposerAttachment file={composer.file} onRemove={() => composer.setFile(null)} />
      )}

      {formatOpen && (
        <FormatToolbar onWrap={composer.wrapAndFocus} onColor={composer.insertColor} />
      )}

      <div className="gap-2 flex items-end">
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(event) => {
            composer.onFileChosen(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        <ComposerTools
          disabled={disabled}
          editing={Boolean(editing)}
          fileInput={fileInput}
          formatOpen={formatOpen}
          onToggleFormat={() => setFormatOpen((previous) => !previous)}
          onInsertEmoji={(emoji) => composer.wrapAndFocus(emoji, '')}
        />

        <div className="min-w-0 flex-1">
          <Textarea
            ref={textarea}
            aria-label={t('communications.messagePlaceholder')}
            // `placeholder:truncate`: a 375 px, con adjuntar + formato + emoji
            // ya puestos, al campo le queda poco ancho y el texto de ejemplo
            // envolvía a una segunda línea que la caja (`min-h-11`) recortaba
            // a medias (Regla 5). Lo que se escribe de verdad no lleva esta
            // clase — sigue creciendo hasta `max-h-40` sin recortarse.
            className="min-h-11 max-h-40 py-2.5 placeholder:truncate"
            rows={1}
            value={composer.body}
            disabled={disabled}
            placeholder={t('communications.messagePlaceholder')}
            onChange={(event) => {
              composer.setBody(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                composer.submit();
              }
            }}
          />
        </div>

        {/* 48 px: es la acción principal de una pantalla táctil (Regla 5 §4). */}
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 shrink-0"
          isLoading={composer.pending}
          disabled={disabled || (!composer.body.trim() && !composer.file)}
          aria-label={t(editing ? 'common.save' : 'communications.messagePlaceholder')}
          onClick={composer.submit}
        >
          <Send size={18} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
