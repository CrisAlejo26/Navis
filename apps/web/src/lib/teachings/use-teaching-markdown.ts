import type { Teaching } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { toTeachingMarkdownBlob } from '@/lib/teachings/body-to-markdown';
import { downloadFile, slugify } from '@/lib/share/files';

/** Descargar una enseñanza, sola, en Markdown (RFC 0022 §4.5): un `.md` suelto. */
export function useTeachingMarkdownDownload() {
  const { t } = useTranslation();

  return (teaching: Teaching): void => {
    const blob = toTeachingMarkdownBlob(teaching, {
      frontmatterTitle: t('teachings.titleField'),
      frontmatterDate: t('teachings.receivedAtField'),
    });

    downloadFile(blob, `${slugify(teaching.title) || 'enseñanza'}.md`);
  };
}
