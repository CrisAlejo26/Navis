import { BELIEVER_STATUSES, type BelieverStatus, type BelieversSummary } from '@navis/shared';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';

/**
 * Las pastillas de estado, **con su cuenta dentro** (§7.1).
 *
 * Aquí es donde vive la métrica, porque aquí es donde se usa: el número no está
 * para mirarlo, está para pulsarlo. La de «piden atención» va en tono `warning`
 * y lleva icono, que es lo que la distingue sin depender del color.
 */
export function StatusPills({
  summary,
  selected,
  attention,
  onToggle,
  onToggleAttention,
}: {
  summary: BelieversSummary | undefined;
  selected: readonly BelieverStatus[];
  attention: boolean;
  onToggle: (status: BelieverStatus) => void;
  onToggleAttention: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-1.5 flex flex-wrap items-center">
      {BELIEVER_STATUSES.map((status) => (
        <Chip
          key={status}
          active={selected.includes(status)}
          onClick={() => {
            onToggle(status);
          }}
        >
          {t(`believers.status.${status}`)}
          {summary && <Count value={summary.byStatus[status]} />}
        </Chip>
      ))}

      <Chip tone="warning" active={attention} onClick={onToggleAttention}>
        <TriangleAlert size={13} aria-hidden />
        {t('believers.onlyAttention')}
        {summary && <Count value={summary.needsAttention} />}
      </Chip>
    </div>
  );
}

/** El número dentro de la pastilla, siempre con el mismo ancho de dígito. */
function Count({ value }: { value: number }) {
  return <span className="text-[11px] tabular-nums opacity-70">{value}</span>;
}
