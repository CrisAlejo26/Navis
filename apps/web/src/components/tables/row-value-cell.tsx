import type { ColumnOption, CustomTableColumn } from '@navis/shared';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { formatDay, formatNumber } from '@/lib/format';

/** Una celda de la cuadrícula, según el tipo de su columna. */
export function RowValueCell({ column, value }: { column: CustomTableColumn; value: unknown }) {
  const { t } = useTranslation();

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  if (column.type === 'password') {
    return <span className="tracking-widest text-muted-foreground">••••••••</span>;
  }

  if (column.type === 'checkbox') {
    return value === true ? (
      <Check size={16} aria-label={t('common.yes')} className="text-success" />
    ) : (
      <X size={16} aria-label={t('common.no')} className="text-muted-foreground" />
    );
  }

  if (column.type === 'date' && typeof value === 'string') {
    return <span>{formatDay(value)}</span>;
  }

  if ((column.type === 'number' || column.type === 'currency') && typeof value === 'number') {
    return <span className="tabular-nums">{formatNumber(value)}</span>;
  }

  if (column.type === 'single_select' && typeof value === 'string') {
    return (
      <OptionChip
        option={(column.options ?? []).find((one) => one.value === value)}
        fallback={value}
      />
    );
  }

  if (column.type === 'multi_select' && Array.isArray(value)) {
    return (
      <div className="gap-1 flex flex-wrap">
        {value.map((one) => (
          <OptionChip
            key={String(one)}
            option={(column.options ?? []).find((opt) => opt.value === one)}
            fallback={String(one)}
          />
        ))}
      </div>
    );
  }

  // Los tipos ya cubiertos arriba no llegan aquí: lo que queda son cadenas
  // (texto, correo, teléfono, URL). Un objeto no debería aparecer nunca en
  // esta rama, pero si lo hiciera, `String()` lo convertiría en
  // «[object Object]» sin avisar (Regla 10).
  const texto = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return <span className="truncate">{texto}</span>;
}

function OptionChip({ option, fallback }: { option: ColumnOption | undefined; fallback: string }) {
  return (
    <span
      style={accentVars(option?.color ?? 'primary')}
      className="px-2 py-0.5 text-xs font-medium inline-flex rounded-full bg-[var(--acento)]/15 text-[var(--acento)]"
    >
      {option?.label ?? fallback}
    </span>
  );
}
