import type { ChannelListItem } from '@navis/shared';

/** El título con el que se busca: el de la otra persona en «individual», el propio si no. */
export function matchesChannelSearch(channel: ChannelListItem, search: string): boolean {
  if (!search) return true;

  const title = channel.kind === 'individual' ? channel.otherMember?.name : channel.name;
  return (title ?? '').toLowerCase().includes(search.toLowerCase());
}
