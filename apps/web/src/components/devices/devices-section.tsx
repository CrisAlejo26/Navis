import { useCreateDeviceLink, useDevices } from '@navis/api-client';
import type { Device, DeviceLink } from '@navis/shared';
import { Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeviceList } from '@/components/devices/device-list';
import { LinkCodePanel } from '@/components/devices/link-code-panel';
import { RevokeDeviceDialog } from '@/components/devices/revoke-device-dialog';
import { Button } from '@/components/ui/button';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Vincular teléfonos a esta instalación. El código se pide aquí, en una sesión
 * de la web, y se canjea en el móvil: la cuenta pone los permisos y el
 * dispositivo solo recibe una credencial propia que se puede revocar.
 */
export function DevicesSection() {
    const { t } = useTranslation();
    const { data: devices, isLoading } = useDevices(api);
    const createLink = useCreateDeviceLink(api);
    const [link, setLink] = useState<DeviceLink | null>(null);
    const [toRevoke, setToRevoke] = useState<Device | null>(null);

    function generate(): void {
        createLink.mutate(undefined, {
            onSuccess: setLink,
            onError: () => {
                toast.error(t('sync.generateFailed'));
            },
        });
    }

    return (
        <div className="gap-4 flex flex-col">
            {link ? (
                <LinkCodePanel
                    link={link}
                    onRegenerate={generate}
                    isRegenerating={createLink.isPending}
                />
            ) : (
                <Button
                    size="lg"
                    className="self-start"
                    isLoading={createLink.isPending}
                    onClick={generate}
                >
                    {!createLink.isPending && <Smartphone aria-hidden className="size-4" />}
                    {createLink.isPending ? t('sync.generating') : t('sync.generate')}
                </Button>
            )}

            <h3 className="mt-2 text-sm font-semibold">{t('sync.devicesTitle')}</h3>
            {isLoading ? (
                <FormSkeleton fields={2} />
            ) : (
                <DeviceList devices={devices ?? []} onRevoke={setToRevoke} />
            )}

            <RevokeDeviceDialog
                device={toRevoke}
                onClose={() => {
                    setToRevoke(null);
                }}
            />
        </div>
    );
}
