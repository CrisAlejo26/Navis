import type { JournalEntry } from '@navis/shared';
import { useTranslation } from 'react-i18next';

/**
 * La anotación y, si la hay, lo aprendido (§7.7).
 *
 * Lo aprendido lleva un filete vertical fino que lo distingue de la
 * anotación: mismo criterio visual que «lo que contó» y «la indicación» en la
 * bitácora de creyentes (RFC 0003 §7.5).
 */
export function EntryAnnotation({ entry }: { entry: JournalEntry }) {
  const { t } = useTranslation();

  return (
    <div className="gap-6 flex flex-col">
      <article
        style={{ animationDelay: '40ms' }}
        className="p-4 sm:p-6 animate-rise-in rounded-xl border bg-card"
      >
        <p className="max-w-prose text-[17px] leading-[1.75] whitespace-pre-wrap">
          {entry.annotation}
        </p>
      </article>

      {entry.learned && (
        <article
          style={{ animationDelay: '100ms' }}
          className="pl-4 animate-rise-in border-l-2 border-l-border"
        >
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t('journal.learnedField')}
          </h2>
          <p className="max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap">
            {entry.learned}
          </p>
        </article>
      )}
    </div>
  );
}
