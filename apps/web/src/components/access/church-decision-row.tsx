import type { ChurchDecision, OwnedChurchImpact } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { ChurchBadge } from '@/components/church-badge';
import { Select } from '@/components/ui/select';
import { useChurches } from '@/lib/churches';

type Action = ChurchDecision['action'] | '';

interface ChurchDecisionRowProps {
  church: OwnedChurchImpact;
  action: Action;
  targetChurchId: string | undefined;
  /** No pueden ser destino: la propia iglesia y las que también se eliminan en este plan. */
  excludedTargetIds: readonly string[];
  onChange: (decision: { action: ChurchDecision['action']; targetChurchId?: string }) => void;
}

/**
 * Una fila del paso 2 de la baja de un dueño de iglesia (RFC 0015): qué pasa
 * con **esta** iglesia. Fichero propio porque `DeleteUserDialog` ya tiene su
 * responsabilidad —confirmar y llamar al hook— y esto es una pieza de
 * formulario con su propia validación, el mismo criterio que ya separa
 * `ChurchFilter` en esta carpeta (Regla 6).
 */
export function ChurchDecisionRow({
  church,
  action,
  targetChurchId,
  excludedTargetIds,
  onChange,
}: ChurchDecisionRowProps) {
  const { t } = useTranslation();
  const { items } = useChurches();
  const destinos = items.filter((candidate) => !excludedTargetIds.includes(candidate.id));

  return (
    <div className="gap-2.5 p-3 flex flex-col rounded-lg border bg-card">
      <div className="gap-2.5 flex items-center">
        <ChurchBadge id={church.id} name={church.name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{church.name}</p>
          <p className="text-xs text-muted-foreground">
            {t('roles.churchImpact', {
              believers: church.believers,
              lists: church.lists,
              calendars: church.calendars,
            })}
          </p>
        </div>
      </div>

      <Select
        size="sm"
        id={`church-action-${church.id}`}
        aria-label={t('roles.churchDecisionRequired')}
        value={action}
        onChange={(event) => {
          const value = event.target.value as Action;
          if (value === 'delete') onChange({ action: 'delete' });
          else if (value === 'transfer')
            onChange({ action: 'transfer', targetChurchId: undefined });
        }}
      >
        <option value="" disabled>
          {t('roles.churchDecisionRequired')}
        </option>
        <option value="delete">{t('roles.churchActionDelete')}</option>
        <option value="transfer">{t('roles.churchActionTransfer')}</option>
      </Select>

      {action === 'transfer' && (
        <Select
          size="sm"
          id={`church-target-${church.id}`}
          label={t('roles.churchTransferTarget')}
          value={targetChurchId ?? ''}
          onChange={(event) => {
            onChange({ action: 'transfer', targetChurchId: event.target.value || undefined });
          }}
        >
          <option value="" disabled>
            {t('roles.churchTransferTarget')}
          </option>
          {destinos.map((destino) => (
            <option key={destino.id} value={destino.id}>
              {destino.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
