import type { ListCredentialSheetRow } from '@navis/shared';
import { AlertTriangle, Copy, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/lists/share-link';
import { toast } from '@/lib/toast';

/**
 * La pantalla de **«una sola vez»** (RFC 0010 D24, D29).
 *
 * Se enseña al crear un acceso o al regenerarlo, y el botón que copia el mensaje
 * ya redactado —enlace, usuario y contraseña— es la diferencia entre que esto se
 * use y que no se use. La contraseña no vuelve a verse: perderla no es un
 * problema, se regenera.
 */
export function CredentialsPanel({
  rows,
  listName,
  url,
}: {
  rows: readonly ListCredentialSheetRow[];
  listName: string;
  url: string;
}) {
  const { t } = useTranslation();

  const mensaje = (row: ListCredentialSheetRow) =>
    t('lists.credentialsMessage', {
      list: listName,
      url,
      username: row.username,
      password: row.password,
    });

  const copiarTodo = () => {
    const texto = rows.map((row) => `${row.name}\t${row.username}\t${row.password}`).join('\n');

    void copyToClipboard(texto).then((ok) => {
      if (ok) toast.success(t('lists.copied'));
    });
  };

  return (
    <div className="gap-3 flex flex-col">
      <p className="gap-1.5 text-sm flex items-start text-warning">
        <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
        {t('lists.passwordOnce')}
      </p>

      <ul className="divide-y rounded-lg border">
        {rows.map((row) => (
          <li key={row.username} className="p-3 gap-2 flex flex-wrap items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.name}</p>
              <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">
                {row.username} · {row.password}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void copyToClipboard(mensaje(row)).then((ok) => {
                  if (ok) toast.success(t('lists.copied'));
                });
              }}
            >
              <MessageSquare size={14} aria-hidden />
              {t('lists.copyCredentials')}
            </Button>
          </li>
        ))}
      </ul>

      {rows.length > 1 && (
        <Button variant="ghost" size="sm" className="self-start" onClick={copiarTodo}>
          <Copy size={14} aria-hidden />
          {t('lists.copySheet')}
        </Button>
      )}
    </div>
  );
}
