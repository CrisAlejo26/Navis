import { useUpdateDream } from '@navis/api-client';
import type { Dream } from '@navis/shared';
import { Compass, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * La posible interpretación (RFC 0005 §7.6).
 *
 * También se puede escribir desde el formulario de apuntar o de editar
 * (`DreamFields`), pero es opcional ahí a propósito (D17): la mayoría de las
 * veces todavía no se sabe qué significa un sueño recién apuntado. Este es el
 * sitio pensado para volver más tarde: se edita **en el sitio, sin abrir un
 * diálogo**, porque es un texto que se retoca muchas veces según pasan los
 * días.
 *
 * Vacía no deja un hueco: invita a escribirla (Regla 9 §6).
 */
export function DreamInterpretation({ dream }: { dream: Dream }) {
  const { t } = useTranslation();
  const update = useUpdateDream(api);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(dream.interpretation ?? '');

  const save = () => {
    void update
      .mutateAsync({ id: dream.id, interpretation: text.trim() || null })
      .then(() => {
        toast.success(t('dreams.updated'));
        setEditing(false);
      })
      .catch(() => {
        toast.error(t('errors.generic'));
      });
  };

  return (
    <section
      style={{ animationDelay: '160ms' }}
      className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-muted/40"
    >
      <h2 className="gap-2 text-sm font-medium flex items-center">
        <Compass size={15} aria-hidden className="text-primary" />
        {t('dreams.interpretation')}
      </h2>

      {editing ? (
        <>
          <Textarea
            rows={6}
            value={text}
            label={t('dreams.interpretation')}
            placeholder={t('dreams.interpretationPlaceholder')}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
          <div className="gap-2 flex">
            <Button size="md" isLoading={update.isPending} onClick={save}>
              {t('common.save')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setText(dream.interpretation ?? '');
                setEditing(false);
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {dream.interpretation ? (
            <p className="max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap">
              {dream.interpretation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('dreams.interpretationEmpty')}</p>
          )}

          <Button
            variant="ghost"
            size="md"
            className="self-start"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil size={15} aria-hidden />
            {dream.interpretation ? t('common.edit') : t('dreams.interpretationAdd')}
          </Button>
        </>
      )}
    </section>
  );
}
