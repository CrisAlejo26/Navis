import type { ChannelListItem } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { useChannelMenu } from '@/lib/chat/use-channel-menu';
import { cn } from '@/lib/cn';
import { ChannelMenuDialogs } from './channel-menu-dialogs';
import { ChannelRowContent } from './channel-row-content';
import { MessageMenu } from './message-menu';

/**
 * Una fila de la bandeja, con su propio menú de opciones (RFC 0019 §1): lo
 * que en WhatsApp se abre al mantener pulsado el chat, aquí siempre visible
 * en `MessageMenu` — reutiliza exactamente las mismas acciones que
 * `ConversationHeader`, vía `useChannelMenu`.
 *
 * En modo selección (`selectMode`) la fila entera es la casilla, como ya
 * hace `Checkbox` (Regla 5): pulsar en cualquier parte marca o desmarca.
 */
export function ChannelRow({
  channel,
  currentUserRole,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: {
  channel: ChannelListItem;
  currentUserRole: string;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { t } = useTranslation();
  const { actions, dialogProps } = useChannelMenu(channel, currentUserRole);
  const title =
    channel.kind === 'individual' ? (channel.otherMember?.name ?? '') : (channel.name ?? '');

  if (selectMode) {
    return (
      <label className="gap-3 px-3 py-2.5 flex cursor-pointer items-center rounded-lg hover:bg-muted">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t('communications.selectConversation', { name: title })}
          className="h-4 w-4 rounded shrink-0 cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <ChannelRowContent channel={channel} isActive={false} />
      </label>
    );
  }

  return (
    <NavLink
      to={`/communications/${channel.id}`}
      className={({ isActive }) =>
        cn(
          'group gap-3 px-3 py-2.5 flex items-center rounded-lg transition-colors duration-150',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <ChannelRowContent channel={channel} isActive={isActive} />
          <MessageMenu actions={actions} />
          <ChannelMenuDialogs {...dialogProps} />
        </>
      )}
    </NavLink>
  );
}
