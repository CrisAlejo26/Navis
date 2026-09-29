import { toTeachingMarkdown, type Teaching } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { downloadFile, slugify } from '@/lib/share/files';

/** Descargar una enseñanza, sola, en Markdown (RFC 0022 §4.5): un `.md` suelto. */
export function useTeachingMarkdownDownload() {
    const { t } = useTranslation();

    return (teaching: Teaching): void => {
        const markdown = toTeachingMarkdown(teaching, {
            frontmatterTitle: t('teachings.titleField'),
            frontmatterDate: t('teachings.receivedAtField'),
        });
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

        downloadFile(blob, `${slugify(teaching.title) || 'enseñanza'}.md`);
    };
}
