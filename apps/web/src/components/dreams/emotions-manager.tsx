import { useDeleteEmotion, useEmotions } from '@navis/api-client';
import { isSystemEmotion, type EmotionWithCount } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmotionChip } from '@/components/dreams/emotion-chip';
import { EmotionForm } from '@/components/dreams/emotion-form';
import { EmotionRow } from '@/components/dreams/emotion-row';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { toast } from '@/lib/toast';

/**
 * El vocabulario de emociones (RFC 0005 D6).
 *
 * Las doce de serie se enseñan y **no se tocan**: salen en el idioma de quien
 * mira, así que renombrarlas rompería justo eso (D4). Las propias se crean, se
 * renombran y se borran, y borrar una no se lleva por delante los sueños que la
 * llevaban.
 */
export function EmotionsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const label = useEmotionLabel();
  const { data: emotions = [] } = useEmotions(api);
  const remove = useDeleteEmotion(api);
  const [borrando, setBorrando] = useState<EmotionWithCount | null>(null);

  const deSerie = emotions.filter(isSystemEmotion);
  const propias = emotions.filter((emotion) => !isSystemEmotion(emotion));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(34rem, calc(100vw - 2rem))"
      title={t('dreams.emotionsManage')}
    >
      <div className="gap-5 min-w-0 flex flex-col">
        <EmotionForm />

        <section className="gap-2 flex flex-col">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">
            {t('dreams.emotionsOwn')}
          </h3>

          {propias.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dreams.emotionsEmpty')}</p>
          ) : (
            <ul className="gap-1 flex flex-col">
              {propias.map((emotion) => (
                <EmotionRow
                  key={emotion.id}
                  emotion={emotion}
                  onDelete={() => {
                    setBorrando(emotion);
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="gap-2 flex flex-col">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">
            {t('dreams.emotionsSystem')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('dreams.emotionSystemHint')}</p>
          <ul className="gap-1.5 flex flex-wrap">
            {deSerie.map((emotion) => (
              <li key={emotion.id}>
                <EmotionChip emotion={emotion} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {borrando && (
        <ConfirmDialog
          open
          destructive
          title={t('dreams.emotionDeleteTitle', { name: label(borrando) })}
          description={t('dreams.emotionDeleteBody')}
          confirmLabel={t('common.delete')}
          isPending={remove.isPending}
          onClose={() => {
            setBorrando(null);
          }}
          onConfirm={() => {
            void remove.mutateAsync(borrando.id).then(() => {
              toast.success(t('dreams.emotionRemoved'));
              setBorrando(null);
            });
          }}
        />
      )}
    </Dialog>
  );
}
