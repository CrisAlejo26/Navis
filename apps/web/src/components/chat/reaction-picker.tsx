import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/** Acotado a propósito (§6): las siete reacciones más comunes, no un teclado de emoji entero. */
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉'] as const;

export function ReactionPicker({
  onSelect,
  className,
}: {
  onSelect: (emoji: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="menu"
      aria-label={t('communications.react')}
      className={cn('p-1.5 gap-1 shadow-lg flex rounded-full border bg-popover', className)}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          onClick={() => {
            onSelect(emoji);
          }}
          aria-label={emoji}
          className="h-9 w-9 text-lg inline-flex cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 hover:bg-muted focus-visible:scale-110 focus-visible:bg-muted focus-visible:outline-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
