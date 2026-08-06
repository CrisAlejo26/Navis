import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';

/**
 * **Si la lista se puede llevar puesta** (RFC 0010 §8.5).
 *
 * Vive al lado de «qué se ve de cada persona» porque es la misma clase de
 * decisión, y por eso se explica igual: apagado, la lista se mira en la página
 * y ahí se queda; encendido, cualquiera que abra el enlace se lleva un PDF o
 * una imagen con los nombres, y ese fichero ya no caduca ni se despublica.
 *
 * Nace apagado, como la foto.
 */
export function DownloadToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="mb-1 gap-1.5 text-sm font-medium inline-flex items-center">
        <Download size={14} aria-hidden />
        {t('lists.downloads')}
      </legend>

      <Checkbox
        checked={value}
        label={t('lists.allowDownload')}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />

      <p className="text-xs text-muted-foreground">
        {value ? t('lists.allowDownloadOn') : t('lists.allowDownloadOff')}
      </p>
    </fieldset>
  );
}
