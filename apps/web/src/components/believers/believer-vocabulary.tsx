import type { BelieverTag, Gift, MinistryCatalog } from '@navis/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverTagPills } from '@/components/believers/believer-tag-pills';
import { GiftTags } from '@/components/believers/gift-tags';
import { MinistryTags } from '@/components/believers/ministry-tags';

/**
 * Lo que alguien **tiene** y para lo que **está disponible**: dones, labores y
 * etiquetas.
 *
 * Van juntos porque se leen juntos, y **rotulados** porque son tres cosas
 * distintas: sin el rótulo, tres filas de etiquetas de colores seguidas se leen
 * como una sola lista. La forma ya los separa —píldora con punto los dones,
 * etiqueta cuadrada con carril las labores, píldora con punto las etiquetas—,
 * y el rótulo lo confirma.
 *
 * El vacío se dice con palabras en vez de desaparecer: que alguien no tenga
 * ninguna etiqueta es un dato, y esconderlo hace pensar que no se ha preguntado.
 */
export function BelieverVocabulary({
  gifts,
  ministrySlugs,
  tags,
  catalog,
}: {
  gifts: readonly Gift[];
  ministrySlugs: readonly string[];
  tags: readonly BelieverTag[];
  catalog: readonly MinistryCatalog[];
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-x-8 gap-y-3 flex flex-wrap">
      <Grupo label={t('believers.gifts')}>
        {gifts.length > 0 ? (
          <GiftTags gifts={gifts} />
        ) : (
          <span className="text-xs text-muted-foreground">{t('gifts.none')}</span>
        )}
      </Grupo>

      <Grupo label={t('ministries.title')}>
        {ministrySlugs.length > 0 ? (
          <MinistryTags slugs={ministrySlugs} catalog={catalog} />
        ) : (
          <span className="text-xs text-muted-foreground">{t('ministries.none')}</span>
        )}
      </Grupo>

      <Grupo label={t('believerTags.title')}>
        {tags.length > 0 ? (
          <BelieverTagPills tags={tags} />
        ) : (
          <span className="text-xs text-muted-foreground">{t('believerTags.none')}</span>
        )}
      </Grupo>
    </div>
  );
}

function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gap-1.5 min-w-0 flex flex-col">
      <span className="font-medium text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="gap-1 flex flex-wrap items-center">{children}</div>
    </div>
  );
}
