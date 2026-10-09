import { useRevokeDevice } from '@navis/api-client';
import type { Device } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

export function RevokeDeviceDialog({
    device,
    onClose,
}: {
    device: Device | null;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const revoke = useRevokeDevice(api);
    const [error, setError] = useState<string | null>(null);

    return (
        <ConfirmDialog
            open={Boolean(device)}
            onClose={onClose}
            destructive
            isPending={revoke.isPending}
            error={error}
            title={t('sync.revokeTitle', { name: device?.name ?? '' })}
            description={t('sync.revokeBody')}
            confirmLabel={t('sync.revoke')}
            onConfirm={() => {
                if (!device) return;
                setError(null);
                revoke.mutate(device.id, {
                    onSuccess: () => {
                        toast.success(t('sync.revoked'));
                        onClose();
                    },
                    onError: () => {
                        setError(t('sync.revokeFailed'));
                    },
                });
            }}
        />
    );
}
