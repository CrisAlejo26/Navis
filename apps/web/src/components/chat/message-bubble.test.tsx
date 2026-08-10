import type { Message } from '@navis/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/lib/i18n';
import { renderWithI18n as render } from '@/test/render';
import { MessageBubble } from './message-bubble';

const base = (over: Partial<Message> = {}): Message => ({
  id: 'm1',
  channelId: 'ch1',
  authorId: 'u1',
  authorName: 'María José',
  authorImage: null,
  body: '¿Confirmamos la hora?',
  replyTo: null,
  forwardedFrom: null,
  attachments: [],
  reactions: [],
  editedAt: null,
  deletedAt: null,
  createdAt: '2026-08-10T14:02:00.000Z',
  ...over,
});

const noop = () => {
  // sin efecto: no le importa a este test qué se hace al pulsar
};

describe('MessageBubble', () => {
  it('pinta el cuerpo del mensaje y el nombre de quien lo escribió en un grupo', () => {
    render(
      <MessageBubble
        message={base()}
        isOwn={false}
        showAuthor
        currentUserId="u2"
        onReply={noop}
        onForward={noop}
        onEdit={noop}
        onDelete={noop}
        onToggleReaction={noop}
      />,
    );

    expect(screen.getByText('¿Confirmamos la hora?')).toBeInTheDocument();
    expect(screen.getByText('María José')).toBeInTheDocument();
  });

  it('un mensaje borrado enseña «Mensaje eliminado» y no su cuerpo original', () => {
    render(
      <MessageBubble
        message={base({ deletedAt: '2026-08-10T14:05:00.000Z' })}
        isOwn
        showAuthor={false}
        currentUserId="u1"
        onReply={noop}
        onForward={noop}
        onEdit={noop}
        onDelete={noop}
        onToggleReaction={noop}
      />,
    );

    expect(screen.getByText(i18n.t('communications.deletedMessage'))).toBeInTheDocument();
    expect(screen.queryByText('¿Confirmamos la hora?')).not.toBeInTheDocument();
  });

  it('reacciona por rol y etiqueta accesible: el menú de acciones se anuncia como tal', () => {
    render(
      <MessageBubble
        message={base()}
        isOwn={false}
        showAuthor={false}
        currentUserId="u2"
        onReply={noop}
        onForward={noop}
        onEdit={noop}
        onDelete={noop}
        onToggleReaction={noop}
      />,
    );

    expect(screen.getByRole('button', { name: i18n.t('nav.more') })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
  });

  it('avisa a `onToggleReaction` al pulsar una reacción ya puesta', async () => {
    const onToggleReaction = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <MessageBubble
        message={base({ reactions: [{ emoji: '👍', userId: 'u2' }] })}
        isOwn={false}
        showAuthor={false}
        currentUserId="u2"
        onReply={noop}
        onForward={noop}
        onEdit={noop}
        onDelete={noop}
        onToggleReaction={onToggleReaction}
      />,
    );

    await user.click(screen.getByText('👍'));
    expect(onToggleReaction).toHaveBeenCalledWith('👍', true);
  });
});
