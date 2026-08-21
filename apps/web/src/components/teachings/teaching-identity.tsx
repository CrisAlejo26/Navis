import type { Teaching } from '@navis/shared';
import { FileText, Image, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { TeachingPostcard } from '@/components/teachings/teaching-postcard';
import { Button } from '@/components/ui/button';
import { MenuButton } from '@/components/ui/menu-button';
import { formatDay } from '@/lib/format';
import { slugify } from '@/lib/share/files';
import { useTeachingImageExport } from '@/lib/teachings/use-teaching-image';
import { useTeachingMarkdownDownload } from '@/lib/teachings/use-teaching-markdown';

/**
 * La cabecera de la ficha (RFC 0022 §3): una franja de acento a todo el
 * ancho, no la tarjeta blanca centrada de `EntryAnnotation` — para que esta
 * lectura no se lea como una copia del cuaderno con otro nombre.
 */
export function TeachingIdentity({
  teaching,
  onEdit,
  onDelete,
}: {
  teaching: Teaching;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const poster = useRef<HTMLDivElement>(null);
  const image = useTeachingImageExport(poster);
  const downloadMarkdown = useTeachingMarkdownDownload();

  return (
    <header className="gap-4 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl bg-accent/10">
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted-foreground uppercase tabular-nums">
          {formatDay(teaching.receivedAt)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-[-0.02em]">
          {teaching.title}
        </h1>
      </div>

      <div className="gap-2 flex flex-wrap">
        <Button size="lg" onClick={onEdit}>
          <Pencil size={18} aria-hidden />
          {t('teachings.edit')}
        </Button>

        <MenuButton
          label={t('common.actions')}
          variant="secondary"
          size="lg"
          icon={<MoreVertical size={16} aria-hidden />}
          options={[
            {
              id: 'markdown',
              label: t('teachings.export.markdown'),
              icon: <FileText size={15} aria-hidden />,
              onSelect: () => {
                downloadMarkdown(teaching);
              },
            },
            {
              id: 'image',
              label: t('teachings.export.image'),
              icon: <Image size={15} aria-hidden />,
              onSelect: () => {
                void image.share(`${slugify(teaching.title) || 'enseñanza'}.png`, teaching.title);
              },
            },
            {
              id: 'delete',
              label: t('common.delete'),
              icon: <Trash2 size={15} aria-hidden />,
              onSelect: onDelete,
            },
          ]}
        />
      </div>

      {/* La postal que se rasteriza, fuera de la pantalla (`rasterize.ts`). */}
      <div aria-hidden className="top-0 pointer-events-none absolute -left-[9999px]">
        <TeachingPostcard
          ref={poster}
          teaching={teaching}
          appName={t('common.appName')}
          continuesLabel={t('teachings.export.continuesInNavis')}
        />
      </div>
    </header>
  );
}
