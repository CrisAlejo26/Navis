import type { ChannelListItem } from '@navis/shared';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { i18n } from '@/lib/i18n';
import { ChannelRow } from './channel-row';

const channel = (over: Partial<ChannelListItem> = {}): ChannelListItem => ({
  id: 'ch1',
  kind: 'individual',
  name: null,
  description: null,
  photoKey: null,
  isArchived: false,
  myRole: 'moderador',
  archivedAt: null,
  mutedUntil: null,
  unreadCount: 0,
  memberCount: 2,
  otherMember: { id: 'u2', name: 'María José Ruiz', email: 'mj@iglesia.es', image: null },
  lastMessage: null,
  ...over,
});

function renderRow(item: ChannelListItem) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ChannelRow channel={item} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ChannelRow', () => {
  it('pinta el nombre de la otra persona en una conversación individual', () => {
    renderRow(channel());
    expect(screen.getByText('María José Ruiz')).toBeInTheDocument();
  });

  it('pinta el no leídos cuando hay mensajes sin leer', () => {
    renderRow(channel({ unreadCount: 4 }));
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('sin no leídos, no pinta ninguna insignia', () => {
    renderRow(channel({ unreadCount: 0 }));
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('un mensaje borrado se anuncia como tal en la vista previa, no con su cuerpo original', () => {
    renderRow(
      channel({
        lastMessage: {
          id: 'm1',
          body: null,
          authorId: 'u2',
          authorName: 'María José',
          hasAttachment: false,
          createdAt: '2026-08-10T14:00:00.000Z',
          deletedAt: '2026-08-10T14:05:00.000Z',
        },
      }),
    );

    expect(screen.getByText(i18n.t('communications.deletedMessage'))).toBeInTheDocument();
  });

  it('un grupo se pinta con su propio nombre, no con el de un miembro', () => {
    renderRow(channel({ kind: 'grupo', name: 'Alabanza', otherMember: null }));
    expect(screen.getByText('Alabanza')).toBeInTheDocument();
  });
});
