import { Archive, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { cn } from '@/lib/cn';

/** Título + nueva conversación, buscador, y los dos interruptores de la bandeja (RFC 0016/0019). */
export function ChannelListHeader({
  onNewConversation,
  search,
  onSearchChange,
  showArchived,
  onToggleArchived,
  selectMode,
  onToggleSelectMode,
}: {
  onNewConversation: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  selectMode: boolean;
  onToggleSelectMode: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-3 gap-3 flex shrink-0 flex-col border-b">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('nav.communications')}</h1>
        <Button
          size="icon"
          variant="ghost"
          aria-label={t('communications.newConversation')}
          onClick={onNewConversation}
        >
          <Plus size={18} aria-hidden />
        </Button>
      </div>

      <SearchField
        value={search}
        onChange={onSearchChange}
        label={t('communications.searchContacts')}
      />

      <div className="gap-4 text-xs flex items-center">
        <button
          type="button"
          onClick={onToggleArchived}
          className={cn(
            'flex items-center text-muted-foreground hover:text-foreground',
            showArchived && 'font-medium text-primary hover:text-primary',
          )}
        >
          <Archive size={12} aria-hidden className="mr-1 inline" />
          {t('communications.archived')}
        </button>

        <button
          type="button"
          onClick={onToggleSelectMode}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            selectMode && 'font-medium text-primary hover:text-primary',
          )}
        >
          {t(selectMode ? 'communications.cancelSelection' : 'communications.selectChats')}
        </button>
      </div>
    </div>
  );
}
