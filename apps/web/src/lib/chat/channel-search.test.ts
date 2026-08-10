import type { ChannelListItem } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { matchesChannelSearch } from './channel-search';

const channel = (over: Partial<ChannelListItem> = {}): ChannelListItem =>
  ({
    id: 'ch1',
    kind: 'individual',
    name: null,
    otherMember: { id: 'u2', name: 'María José Ruiz', email: 'mj@iglesia.es', image: null },
    ...over,
  }) as ChannelListItem;

describe('matchesChannelSearch', () => {
  it('sin texto de búsqueda, todo casa', () => {
    expect(matchesChannelSearch(channel(), '')).toBe(true);
  });

  it('busca por el nombre de la otra persona en una conversación individual', () => {
    expect(matchesChannelSearch(channel(), 'josé')).toBe(true);
    expect(matchesChannelSearch(channel(), 'elda')).toBe(false);
  });

  it('busca por el nombre propio del canal en un grupo o un aviso', () => {
    const grupo = channel({ kind: 'grupo', name: 'Alabanza', otherMember: null });
    expect(matchesChannelSearch(grupo, 'alaban')).toBe(true);
    expect(matchesChannelSearch(grupo, 'josé')).toBe(false);
  });

  it('no distingue mayúsculas de minúsculas', () => {
    expect(matchesChannelSearch(channel(), 'MARÍA')).toBe(true);
  });
});
