import { Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/ui/search-field';
import { EMOJI_CATEGORIES, searchEmoji } from '@/lib/chat/emoji-data';
import { useRecentEmojiStore } from '@/lib/chat/emoji-recent';
import { cn } from '@/lib/cn';
import { useDismissablePopover } from '@/lib/use-dismissable-popover';

/**
 * Selector de emoji para **escribir** en el compositor (RFC 0019 §1):
 * categorías de Unicode, buscador y recientes — un catálogo comparable al de
 * WhatsApp, con interfaz propia de Navis (Regla 9), no un componente de
 * picker importado tal cual. Independiente de `ReactionPicker`, que sigue
 * acotado a propósito para reaccionar.
 */
export function EmojiPicker({
  onSelect,
  onClose,
  className,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const recent = useRecentEmojiStore((state) => state.recent);
  const addRecent = useRecentEmojiStore((state) => state.addRecent);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(
    recent.length > 0 ? 'recent' : (EMOJI_CATEGORIES[0]?.slug ?? ''),
  );
  const box = useDismissablePopover<HTMLDivElement>(true, onClose);

  const results = search.trim() ? searchEmoji(search) : null;
  const activeCategory = EMOJI_CATEGORIES.find((entry) => entry.slug === category);
  const shown = results ?? (category === 'recent' ? recent : (activeCategory?.emojis ?? []));

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={t('communications.emojiPicker')}
      className={cn(
        'h-80 animate-page-in shadow-lg flex w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border bg-popover',
        className,
      )}
    >
      <div className="p-2 border-b">
        <SearchField
          value={search}
          onChange={setSearch}
          label={t('communications.searchEmoji')}
          delay={150}
        />
      </div>

      {!results && (
        <div className="px-1.5 py-1 gap-0.5 flex shrink-0 overflow-x-auto">
          {recent.length > 0 && (
            <button
              type="button"
              aria-label={t('communications.recentEmoji')}
              aria-current={category === 'recent'}
              onClick={() => setCategory('recent')}
              className={cn(
                'h-8 w-8 inline-flex shrink-0 items-center justify-center rounded-lg',
                category === 'recent' ? 'bg-muted' : 'hover:bg-muted',
              )}
            >
              <Clock size={15} aria-hidden />
            </button>
          )}
          {EMOJI_CATEGORIES.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              aria-label={t(entry.labelKey)}
              aria-current={category === entry.slug}
              onClick={() => setCategory(entry.slug)}
              className={cn(
                'h-8 w-8 text-base inline-flex shrink-0 items-center justify-center rounded-lg',
                category === entry.slug ? 'bg-muted' : 'hover:bg-muted',
              )}
            >
              {entry.emojis[0]}
            </button>
          ))}
        </div>
      )}

      <div className="p-1.5 grid flex-1 auto-rows-min grid-cols-7 overflow-y-auto border-t">
        {shown.length === 0 && (
          <p className="p-4 text-sm col-span-7 text-center text-muted-foreground">
            {t('communications.noEmojiResults')}
          </p>
        )}
        {shown.map((emoji, index) => (
          <button
            key={`${emoji}-${String(index)}`}
            type="button"
            aria-label={emoji}
            onClick={() => {
              addRecent(emoji);
              onSelect(emoji);
            }}
            className="h-9 w-9 text-lg inline-flex cursor-pointer items-center justify-center rounded-lg transition-transform duration-150 hover:scale-110 hover:bg-muted focus-visible:scale-110 focus-visible:bg-muted focus-visible:outline-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
