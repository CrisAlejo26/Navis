import type { BelieverListItem } from '@navis/shared';
import { BookOpen, GraduationCap, NotebookText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Las tres cuentas de la trayectoria: Biblia, vivencias e institutos.
 *
 * Van juntas y en cifras grandes porque es lo que se mira de reojo, y **la que
 * no está no sale**: un «0» donde nadie ha contado nada no es un cero, es un
 * dato que falta, y los dos se leerían igual.
 */
export function JourneyCounts({ believer }: { believer: BelieverListItem }) {
  const { t } = useTranslation();

  const cuentas = [
    { key: 'bible', icon: BookOpen, value: believer.bibleReadings },
    { key: 'vivencias', icon: NotebookText, value: believer.vivenciasReadings },
    { key: 'institute', icon: GraduationCap, value: believer.bibleInstituteTimes },
  ] as const;

  const conValor = cuentas.filter((one) => one.value !== null);
  if (conValor.length === 0) return null;

  return (
    <dl className="gap-3 sm:grid-cols-3 grid">
      {conValor.map(({ key, icon: Icon, value }) => (
        <div key={key} className="px-3 py-2.5 gap-0.5 flex flex-col rounded-lg bg-muted/60">
          <dt className="gap-1.5 text-xs flex items-center text-muted-foreground">
            <Icon size={13} aria-hidden />
            {t(`believers.journey.${key}`)}
          </dt>
          <dd className="text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
