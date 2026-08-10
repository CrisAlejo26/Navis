import type { ChannelDetail, ChannelListItem, ChatContact } from '@navis/shared';

import type { ChannelMember } from './channel-member.entity';
import type { Channel } from './channel.entity';
import type { RawLastMessage } from './channel-stats.service';

/** El nombre y el avatar, tal y como los pinta la interfaz si faltan (cuenta borrada). */
function contactOf(userId: string, users: Map<string, ChatContact>): ChatContact {
  return users.get(userId) ?? { id: userId, name: '', email: '', image: null };
}

export function toChannelListItem(params: {
  channel: Channel;
  membership: ChannelMember;
  memberCount: number;
  unreadCount: number;
  lastMessage: RawLastMessage | null;
  otherMember: ChatContact | null;
  users: Map<string, ChatContact>;
}): ChannelListItem {
  const { channel, membership, memberCount, unreadCount, lastMessage, otherMember, users } = params;

  return {
    id: channel.id,
    kind: channel.kind,
    name: channel.name,
    description: channel.description,
    photoKey: channel.photoKey,
    isArchived: channel.isArchived,
    myRole: membership.role,
    archivedAt: membership.archivedAt?.toISOString() ?? null,
    mutedUntil: membership.mutedUntil?.toISOString() ?? null,
    unreadCount,
    memberCount,
    otherMember,
    lastMessage: lastMessage
      ? { ...lastMessage, authorName: contactOf(lastMessage.authorId, users).name }
      : null,
  };
}

export function toChannelDetail(
  listItem: ChannelListItem,
  channel: Channel,
  members: ChannelMember[],
  users: Map<string, ChatContact>,
): ChannelDetail {
  return {
    ...listItem,
    createdBy: channel.createdBy,
    members: members.map((member) => {
      const contact = contactOf(member.userId, users);
      return {
        userId: member.userId,
        name: contact.name,
        email: contact.email,
        image: contact.image,
        role: member.role,
        lastReadAt: member.lastReadAt.toISOString(),
        mutedUntil: member.mutedUntil?.toISOString() ?? null,
      };
    }),
  };
}
