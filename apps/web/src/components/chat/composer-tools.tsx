import { Paperclip, Smile, Type } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { EmojiPicker } from './emoji-picker';

/**
 * Adjuntar, formato y emoji: los tres controles a la izquierda del `Textarea`
 * (RFC 0019 §1). `formatOpen` se expone hacia fuera porque `Composer` tiene
 * que pintar la barra de formato **encima** del `Textarea`, no aquí al lado.
 */
export function ComposerTools({
  disabled,
  editing,
  fileInput,
  formatOpen,
  onToggleFormat,
  onInsertEmoji,
}: {
  disabled?: boolean;
  editing: boolean;
  fileInput: RefObject<HTMLInputElement | null>;
  formatOpen: boolean;
  onToggleFormat: () => void;
  onInsertEmoji: (emoji: string) => void;
}) {
  const { t } = useTranslation();
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <>
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={t('communications.formatting')}
        aria-pressed={formatOpen}
        onClick={onToggleFormat}
        className={cn(formatOpen && 'bg-muted text-foreground')}
      >
        <Type size={18} aria-hidden />
      </Button>

      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={t('communications.emojiPicker')}
          aria-pressed={emojiOpen}
          onClick={() => setEmojiOpen((previous) => !previous)}
          className={cn(emojiOpen && 'bg-muted text-foreground')}
        >
          <Smile size={18} aria-hidden />
        </Button>

        {emojiOpen && (
          <EmojiPicker
            className="left-0 mb-2 absolute bottom-full z-20"
            onSelect={onInsertEmoji}
            onClose={() => setEmojiOpen(false)}
          />
        )}
      </div>
    </>
  );
}
