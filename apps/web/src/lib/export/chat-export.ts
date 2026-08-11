import type { ApiClient } from '@navis/api-client';
import type { ChannelListItem } from '@navis/shared';

import { downloadFile, slugify } from '@/lib/share/files';
import { fetchChatTranscript, type ChatTranscriptLabels } from './chat-transcript';
import { exportFileName } from './file-name';
import { buildZip, utf8 } from './zip';

function channelTitle(channel: ChannelListItem): string {
  return channel.kind === 'individual' ? (channel.otherMember?.name ?? '') : (channel.name ?? '');
}

/** Una conversación, a `.txt` — mismo formato que el propio "Exportar chat" de WhatsApp. */
export async function exportChat(
  api: ApiClient,
  channel: ChannelListItem,
  labels: ChatTranscriptLabels,
): Promise<void> {
  const text = await fetchChatTranscript(api, channel.id, labels);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadFile(blob, exportFileName('comunicaciones', 'txt', channelTitle(channel)));
}

/**
 * Varias conversaciones, en un `.zip` con un `.txt` por conversación —
 * mismo patrón que `toEntriesZip` del cuaderno (RFC 0017 D12), sobre otro
 * contenido: el escritor de ZIP sin comprimir es el mismo (Regla 1 §5).
 */
export async function exportChats(
  api: ApiClient,
  channels: readonly ChannelListItem[],
  labels: ChatTranscriptLabels,
): Promise<void> {
  const usados = new Map<string, number>();

  const entries = await Promise.all(
    channels.map(async (channel) => {
      const text = await fetchChatTranscript(api, channel.id, labels);
      const base = slugify(channelTitle(channel)) || 'conversacion';
      const veces = usados.get(base) ?? 0;
      usados.set(base, veces + 1);
      const name = veces === 0 ? `${base}.txt` : `${base}-${String(veces + 1)}.txt`;

      return { name, data: utf8(text) };
    }),
  );

  const blob = buildZip(entries, 'application/zip');
  downloadFile(blob, exportFileName('comunicaciones', 'zip'));
}
