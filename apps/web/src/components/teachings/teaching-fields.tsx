import { EMPTY_TEACHING_BODY, toIsoDate, type Teaching, type TeachingBody } from '@navis/shared';
import { Suspense, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { TeachingEditor } from '@/components/teachings/editor/lazy';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface FieldsProps {
  teaching?: Teaching;
  titleRef: RefObject<HTMLInputElement | null>;
  body: TeachingBody;
  onBodyChange: (body: TeachingBody) => void;
}

/** Lo que se pide de una enseñanza (RFC 0022 §1): título, fecha y observaciones. */
export function TeachingFields({ teaching, titleRef, body, onBodyChange }: FieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Input
        ref={titleRef}
        name="title"
        label={t('teachings.titleField')}
        placeholder={t('teachings.titlePlaceholder')}
        defaultValue={teaching?.title}
        maxLength={200}
        required
      />

      <Input
        name="receivedAt"
        type="date"
        label={t('teachings.receivedAtField')}
        defaultValue={teaching?.receivedAt ?? toIsoDate(new Date())}
        required
      />

      <div className="gap-1.5 flex flex-col">
        <span className="text-sm font-medium">{t('teachings.notesField')}</span>
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <TeachingEditor value={body ?? EMPTY_TEACHING_BODY} onChange={onBodyChange} />
        </Suspense>
      </div>
    </>
  );
}
