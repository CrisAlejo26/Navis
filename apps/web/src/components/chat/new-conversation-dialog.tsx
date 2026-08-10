import { useChatContacts, useCreateChannel } from '@navis/api-client';
import type { ChannelKind } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { ChatAvatar } from './avatar';

const KINDS: readonly ChannelKind[] = ['individual', 'grupo', 'aviso'];

const KIND_LABEL_KEY: Record<ChannelKind, string> = {
  individual: 'communications.individualLabel',
  grupo: 'communications.groupLabel',
  aviso: 'communications.avisoLabel',
};

/** Elegir con quién hablar, o crear un grupo o un canal de aviso (RFC 0016 D5). */
export function NewConversationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kind, setKind] = useState<ChannelKind>('individual');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const { data: contacts, isLoading } = useChatContacts(api, search, open);
  const create = useCreateChannel(api);

  function close() {
    setKind('individual');
    setSearch('');
    setSelected([]);
    setName('');
    onClose();
  }

  function toggle(id: string) {
    if (kind === 'individual') {
      setSelected([id]);
      return;
    }
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((one) => one !== id) : [...previous, id],
    );
  }

  function submit() {
    create.mutate(
      { kind, memberIds: selected, name: kind === 'individual' ? undefined : name },
      {
        onSuccess: (channel) => {
          close();
          void navigate(`/communications/${channel.id}`);
        },
      },
    );
  }

  const canSubmit = selected.length > 0 && (kind === 'individual' || name.trim().length > 0);

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('communications.newConversation')}
      width="min(28rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        <div className="p-1 gap-1 flex rounded-lg bg-muted">
          {KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setKind(option);
                setSelected([]);
              }}
              className={cn(
                'h-9 text-sm flex-1 rounded-md transition-colors',
                kind === option ? 'shadow-sm font-medium bg-card' : 'text-muted-foreground',
              )}
            >
              {t(KIND_LABEL_KEY[option])}
            </button>
          ))}
        </div>

        {kind !== 'individual' && (
          <Input
            name="groupName"
            label={t('communications.groupName')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        )}

        <SearchField
          value={search}
          onChange={setSearch}
          label={t('communications.searchContacts')}
        />

        <div className="max-h-64 gap-1 flex flex-col overflow-y-auto">
          {isLoading && <p className="p-3 text-sm text-muted-foreground">{t('common.loading')}</p>}

          {contacts?.map((contact) => {
            const checked = selected.includes(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => toggle(contact.id)}
                className={cn(
                  'p-2 gap-2.5 flex items-center rounded-lg text-left transition-colors',
                  checked ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <ChatAvatar id={contact.id} name={contact.name} image={contact.image} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="text-sm block truncate">{contact.name}</span>
                  <span className="text-xs block truncate text-muted-foreground">
                    {contact.email}
                  </span>
                </span>
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
          <Button onClick={submit} disabled={!canSubmit} isLoading={create.isPending}>
            {t('communications.newConversation')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
