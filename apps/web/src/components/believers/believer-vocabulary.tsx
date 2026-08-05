import type { Gift, MinistryCatalog } from '@navis/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { GiftTags } from '@/components/believers/gift-tags';
import { MinistryTags } from '@/components/believers/ministry-tags';

/**
 * Lo que alguien **tiene** y para lo que **está disponible**: dones y labores.
 *
 * Van juntos porque se leen juntos, y **rotulados** porque son dos cosas
 * distintas: sin el rótulo, dos filas de etiquetas de colores seguidas se leen
 * como una sola lista. La forma ya los separa —píldora con punto los dones,
 * etiqueta cuadrada con carril las labores—, y el rótulo lo confirma.
 *
 * El vacío se dice con palabras en vez de desaparecer: que alguien no tenga
 * ninguna labor es un dato, y esconderlo hace pensar que no se ha preguntado.
 */
export function BelieverVocabulary({
  gifts,
  ministrySlugs,
  catalog,
}: {
  gifts: readonly Gift[];
  ministrySlugs: readonly string[];
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
