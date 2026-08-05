import { useUpdateEmotion } from '@navis/api-client';
import type { EmotionWithCount } from '@navis/shared';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmotionChip } from '@/components/dreams/emotion-chip';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Una emoción propia en el gestor: se ve, se renombra y se borra (D6).
 *
 * El modo edición vive aquí y no en el gestor porque es estado de **esta**
 * fila: subirlo obligaría al padre a llevar cuál se está editando, y eso es
 * justo el componente que lo hace todo que evita la Regla 1 §4.
 */
export function EmotionRow({
  emotion,
  onDelete,
}: {
  emotion: EmotionWithCount;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateEmotion(api);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(emotion.name ?? '');
  const [accent, setAccent] = useState(emotion.accent);

  const save = () => {
    if (name.trim() === '') return;

    void update
      .mutateAsync({ id: emotion.id, name: name.trim(), accent })
      .then(() => {
        toast.success(t('dreams.emotionUpdated'));
        setEditing(false);
      })
      .catch(() => {
        toast.error(t('errors.generic'));
      });
  };

  if (editing) {
    return (
      <li className="gap-3 p-3 flex flex-col rounded-lg border">
        <Input
          value={name}
          label={t('dreams.emotionName')}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <ColorPicker value={accent} onChange={setAccent} label={t('dreams.emotionColor')} />

        <div className="gap-2 flex">
          <Button size="md" isLoading={update.isPending} onClick={save}>
            <Check size={15} aria-hidden />
            {t('common.save')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setEditing(false);
            }}
          >
            <X size={15} aria-hidden />
            {t('common.cancel')}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="gap-2 py-1 flex items-center">
      <EmotionChip emotion={emotion} />
      <span className="text-xs text-muted-foreground tabular-nums">
        {t('dreams.emotionUses', { total: emotion.count })}
      </span>

      <span className="gap-1 ml-auto flex">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.edit')}
          onClick={() => {
            setEditing(true);
          }}
        >
          <Pencil size={15} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.delete')}
          className="hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={15} aria-hidden />
        </Button>
      </span>
    </li>
  );
}
