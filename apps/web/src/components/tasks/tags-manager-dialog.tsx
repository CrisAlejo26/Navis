import { useDeleteTag, useTags } from '@navis/api-client';
import type { Tag } from '@navis/shared';
import { Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TagChip } from '@/components/tasks/tag-chip';
import { TagForm } from '@/components/tasks/tag-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** El vocabulario de etiquetas de la cuenta (RFC 0018 §7, D12). */
export function TagsManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags(api);
  const remove = useDeleteTag(api);

  const [editing, setEditing] = useState<Tag | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('tasks.manageTags')}
      width="min(28rem, calc(100vw - 2rem))"
    >
      <div className="gap-4 flex flex-col">
        <button
          type="button"
          onClick={() => {
            setEditing('new');
          }}
          className="gap-2 px-3.5 h-10 text-sm font-medium flex cursor-pointer items-center rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus size={15} aria-hidden />
          {t('tasks.addTag')}
        </button>

        {tags.length === 0 ? (
          <EmptyState icon={TagIcon} title={t('tasks.noIconResults')} />
        ) : (
          <ul className="gap-1.5 flex flex-col">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="gap-2 p-2 flex items-center justify-between rounded-lg hover:bg-muted"
              >
                <TagChip tag={tag} />
                <div className="gap-1 flex shrink-0">
                  <button
                    type="button"
                    aria-label={t('tasks.editTag')}
                    onClick={() => {
                      setEditing(tag);
                    }}
                    className="h-8 w-8 flex cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <Pencil size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => {
                      setDeleting(tag);
                    }}
                    className="h-8 w-8 flex cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => {
          setEditing(null);
        }}
        title={editing === 'new' ? t('tasks.addTag') : t('tasks.editTag')}
      >
        {editing && (
          <TagForm
            key={editing === 'new' ? 'new' : editing.id}
            tag={editing === 'new' ? undefined : editing}
            onSaved={() => {
              setEditing(null);
            }}
          />
        )}
      </Dialog>

      {deleting && (
        <ConfirmDialog
          open
          destructive
          title={t('tasks.tagDeleteTitle', { name: deleting.name })}
          description={t('tasks.tagDeleteBody')}
          confirmLabel={t('common.delete')}
          isPending={remove.isPending}
          onClose={() => {
            setDeleting(null);
          }}
          onConfirm={() => {
            void remove.mutateAsync(deleting.id).then(() => {
              toast.success(t('tasks.tagRemoved'));
              setDeleting(null);
            });
          }}
        />
      )}
    </Dialog>
  );
}
