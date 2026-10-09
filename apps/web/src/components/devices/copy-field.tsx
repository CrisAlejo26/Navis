import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

/** Un dato para llevarse al teléfono: etiqueta, valor legible y un botón que lo copia. */
export function CopyField({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(t('sync.copied'));
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            toast.error(t('errors.generic'));
        }
    }

    return (
        <div className="gap-1 flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className="gap-2 flex items-center">
                <code
                    className={cn(
                        'px-3 py-2 min-w-0 text-sm flex-1 rounded-md bg-muted break-all',
                        mono && 'font-mono tracking-wider',
                    )}
                >
                    {value}
                </code>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label={`${t('sync.copy')}: ${label}`}
                    onClick={() => void copy()}
                >
                    {copied ? (
                        <Check aria-hidden className="size-4" />
                    ) : (
                        <Copy aria-hidden className="size-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
