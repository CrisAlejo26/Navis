import { useRevealTableField } from '@navis/api-client';
import type { CustomTableColumn } from '@navis/shared';
import { Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

/**
 * Una celda de contraseña ya guardada, oculta por defecto (RFC 0021 D22):
 * puntos y dos gestos explícitos, revelar o cambiar — nunca en claro por
 * defecto y nunca reenviada tal cual al guardar.
 */
export function PasswordRowField({
  tableId,
  rowId,
  column,
  hasValue,
  onEdit,
}: {
  tableId: string;
  rowId: string;
  column: CustomTableColumn;
  hasValue: boolean;
  onEdit: (value: string) => void;
}) {
  const { t } = useTranslation();
  const reveal = useRevealTableField(api);
  const [revealed, setRevealed] = useState<string | null>(null);

  if (!hasValue) {
    return (
      <Input
        type="password"
        label={column.label}
        value=""
        onChange={(event) => {
          onEdit(event.target.value);
        }}
      />
    );
  }

  return (
    <div className="gap-1.5 flex flex-col">
      <span className="text-sm font-medium">{column.label}</span>
      <div className="gap-2 flex items-center">
        <code className="px-3 py-2 text-sm flex-1 rounded-lg border bg-muted/40">
          {revealed ?? '••••••••'}
        </code>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={reveal.isPending}
          onClick={() => {
            reveal.mutate(
              { tableId, rowId, columnKey: column.key },
              {
                onSuccess: (data) => {
                  setRevealed(data.value);
                },
              },
            );
          }}
        >
          <Eye size={14} aria-hidden />
          {t('tables.reveal')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onEdit('');
          }}
        >
          <Pencil size={14} aria-hidden />
          {t('tables.changePassword')}
        </Button>
      </div>
    </div>
  );
}
