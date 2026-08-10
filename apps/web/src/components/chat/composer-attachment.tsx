import { FileText, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatBytes } from '@/lib/format';

/** La vista previa de lo elegido, antes de pulsar enviar (RFC 0016 §5, compositor). */
export function ComposerAttachment({ file, onRemove }: { file: File; onRemove: () => void }) {
  const { t } = useTranslation();
  const isImage = file.type.startsWith('image/');
  // El objeto se crea en el render (memoizado por fichero) y solo se limpia en
  // el efecto: así no hace falta `setState` dentro de él.
  const url = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <div className="p-2 mb-2 gap-2.5 flex items-center rounded-lg border bg-muted">
      {isImage && url ? (
        <img src={url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="h-12 w-12 inline-flex shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground">
          <FileText size={20} aria-hidden />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="text-sm block truncate">{file.name}</span>
        <span className="text-xs block text-muted-foreground">{formatBytes(file.size)}</span>
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={t('communications.removeAttachment')}
        className="h-9 w-9 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
