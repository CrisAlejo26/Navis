import type { ChannelListItem } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { exportChat, exportChats } from '@/lib/export/chat-export';
import { toast } from '@/lib/toast';
import { chatTranscriptLabels } from './transcript-labels';

/** Exporta las conversaciones marcadas en la bandeja (RFC 0019 §1): una a `.txt`, varias a `.zip`. */
export function useExportSelected(
  channels: readonly ChannelListItem[],
  selectedIds: ReadonlySet<string>,
  onDone: () => void,
) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  async function exportSelected() {
    const chosen = channels.filter((channel) => selectedIds.has(channel.id));
    if (chosen.length === 0) return;

    setExporting(true);
    try {
      const labels = chatTranscriptLabels(t);
      if (chosen.length === 1 && chosen[0]) await exportChat(api, chosen[0], labels);
      else await exportChats(api, chosen, labels);
      onDone();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportSelected };
}
