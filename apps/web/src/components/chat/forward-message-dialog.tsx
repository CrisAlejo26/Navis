import { useChannels, useForwardMessage } from '@navis/api-client';
import type { Message } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { ChatAvatar } from './avatar';

/** Reenviar un mensaje a una o varias conversaciones (RFC 0016 D4). */
export function ForwardMessageDialog({
  message,
  onClose,
}: {
  message: Message | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: channels } = useChannels(api, {}, Boolean(message));
  const forward = useForwardMessage(api);
  const [selected, setSelected] = useState<string[]>([]);

  function close() {
    setSelected([]);
    onClose();
  }

  function submit() {
    if (!message) return;

    forward.mutate(
      { id: message.id, channelIds: selected },
      {
        onSuccess: () => {
          toast.success(t('communications.forwarded'));
          close();
        },
      },
    );
  }

  return (
    <Dialog open={Boolean(message)} onClose={close} title={t('communications.forwardTo')}>
      <div className="gap-4 flex flex-col">
        <div className="max-h-72 gap-1 flex flex-col overflow-y-auto">
          {channels?.map((channel) => {
            const title =
              channel.kind === 'individual'
                ? (channel.otherMember?.name ?? '')
                : (channel.name ?? '');
            const avatarId =
              channel.kind === 'individual' ? (channel.otherMember?.id ?? channel.id) : channel.id;
            const checked = selected.includes(channel.id);

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() =>
                  setSelected((previous) =>
                    checked
                      ? previous.filter((one) => one !== channel.id)
                      : [...previous, channel.id],
                  )
                }
                className={cn(
                  'p-2 gap-2.5 flex items-center rounded-lg text-left transition-colors',
                  checked ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <ChatAvatar
                  id={avatarId}
                  name={title}
                  image={
                    channel.kind === 'individual' ? (channel.otherMember?.image ?? null) : null
                  }
                  size="sm"
                />
                <span className="text-sm min-w-0 flex-1 truncate">{title}</span>
                {checked && (
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <div className="gap-2 flex justify-end">
          <Button variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={selected.length === 0} isLoading={forward.isPending}>
            {t('communications.forward')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
