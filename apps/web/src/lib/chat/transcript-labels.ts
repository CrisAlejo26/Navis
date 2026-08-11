import type { TFunction } from 'i18next';

import type { ChatTranscriptLabels } from '@/lib/export/chat-transcript';

/** Los mismos textos, traducidos, para quien exporta una conversación o varias. */
export function chatTranscriptLabels(t: TFunction): ChatTranscriptLabels {
  return {
    deletedMessage: t('communications.deletedMessage'),
    forwarded: t('communications.forwarded'),
    attachmentLine: (name) => t('communications.exportAttachment', { name }),
  };
}
