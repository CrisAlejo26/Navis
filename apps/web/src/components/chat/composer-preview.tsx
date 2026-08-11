import type { Message } from '@navis/shared';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** La franja de «respondiendo a…» o «editando», encima del `Textarea` (RFC 0016 §6). */
export function ComposerPreview({
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
}: {
  replyTo: Message | null;
  editing: Message | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}) {
  const { t } = useTranslation();

  if (editing) {
    return (
      <div className="p-2 mb-2 gap-2 flex items-center rounded-lg border-l-2 border-primary bg-muted">
        <p className="text-xs font-medium flex-1 text-primary">{t('common.edit')}</p>
        <button
          type="button"
          onClick={onCancelEdit}
          aria-label={t('common.close')}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    );
  }

  if (!replyTo) return null;

  return (
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
  );
}
