import { useChannels } from '@navis/api-client';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectionBar } from '@/components/ui/selection-bar';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { matchesChannelSearch } from '@/lib/chat/channel-search';
import { usePollFallback } from '@/lib/chat/chat-socket-hooks';
import { useExportSelected } from '@/lib/chat/use-export-selected';
import { useSelection } from '@/lib/use-selection';
import { ChannelListHeader } from './channel-list-header';
import { ChannelRow } from './channel-row';

/** La bandeja de Comunicaciones, a la izquierda del maestro-detalle (RFC 0016 §5). */
export function ChannelList({ onNewConversation }: { onNewConversation: () => void }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const currentUserRole = session?.user.role ?? 'creyente';
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const selection = useSelection();
  const { data: channels, isLoading } = useChannels(
    api,
    { archived: showArchived },
    true,
    usePollFallback(),
  );

  const filtered = (channels ?? []).filter((channel) => matchesChannelSearch(channel, search));
  const { exporting, exportSelected } = useExportSelected(filtered, selection.selected, () => {
    selection.clear();
    setSelectMode(false);
  });

  return (
    <div className="flex h-full flex-col border-r">
      <ChannelListHeader
        onNewConversation={onNewConversation}
        search={search}
        onSearchChange={setSearch}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((previous) => !previous)}
        selectMode={selectMode}
        onToggleSelectMode={() => {
          setSelectMode((previous) => !previous);
          selection.clear();
        }}
      />

      {selectMode && (
        <div className="p-2 pb-0">
          <SelectionBar
            count={selection.count}
            isExporting={exporting}
            onExport={() => void exportSelected()}
            onClear={selection.clear}
          />
        </div>
      )}

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
          <ChannelRow
            key={channel.id}
            channel={channel}
            currentUserRole={currentUserRole}
            selectMode={selectMode}
            selected={selection.selected.has(channel.id)}
            onToggleSelect={() => {
              selection.toggle(channel.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
