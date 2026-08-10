import { useChannels } from '@navis/api-client';
import { Archive, MessageCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import { matchesChannelSearch } from '@/lib/chat/channel-search';
import { usePollFallback } from '@/lib/chat/chat-socket-hooks';
import { cn } from '@/lib/cn';
import { ChannelRow } from './channel-row';

/** La bandeja de Comunicaciones, a la izquierda del maestro-detalle (RFC 0016 §5). */
export function ChannelList({ onNewConversation }: { onNewConversation: () => void }) {
  const { t } = useTranslation();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const { data: channels, isLoading } = useChannels(
    api,
    { archived: showArchived },
    true,
    usePollFallback(),
  );

  const filtered = (channels ?? []).filter((channel) => matchesChannelSearch(channel, search));

  return (
    <div className="flex h-full flex-col border-r">
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
          onChange={setSearch}
          label={t('communications.searchContacts')}
        />

        <button
          type="button"
          onClick={() => {
            setShowArchived((previous) => !previous);
          }}
          className={cn(
            'text-xs self-start text-muted-foreground hover:text-foreground',
            showArchived && 'font-medium text-primary hover:text-primary',
          )}
        >
          <Archive size={12} aria-hidden className="mr-1 inline" />
          {t('communications.archived')}
        </button>
      </div>

      <div className="p-2 gap-0.5 flex flex-1 flex-col overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">{t('common.loading')}</p>}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title={t('communications.noConversations')}
            action={
              !showArchived && (
                <Button onClick={onNewConversation}>{t('communications.newConversation')}</Button>
              )
            }
          >
            {!showArchived && t('communications.startOne')}
          </EmptyState>
        )}

        {filtered.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} />
        ))}
      </div>
    </div>
  );
}
