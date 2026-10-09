import type { Device } from '@navis/shared';
import { Smartphone, Unlink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { IconAction } from '@/components/ui/icon-action';
import { formatDateTime } from '@/lib/format';

export function DeviceList({
    devices,
    onRevoke,
}: {
    devices: Device[];
    onRevoke: (device: Device) => void;
}) {
    const { t } = useTranslation();

    if (devices.length === 0) {
        return (
            <EmptyState icon={Smartphone} title={t('sync.devicesEmpty')}>
                {t('sync.devicesEmptyHint')}
            </EmptyState>
        );
    }

    return (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {devices.map((device) => (
                <li key={device.id} className="gap-3 p-4 flex items-center">
                    <Smartphone aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                        <p className="gap-2 font-medium flex flex-wrap items-center">
                            <span className="break-words">{device.name}</span>
                            {device.current && <Badge>{t('sync.thisDevice')}</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {device.lastSeenAt
                                ? t('sync.lastSeen', {
                                      when: formatDateTime(device.lastSeenAt.toISOString()),
                                  })
                                : t('sync.neverSeen')}
                        </p>
                    </div>
                    <IconAction
                        tone="destructive"
                        aria-label={`${t('sync.revoke')}: ${device.name}`}
                        onClick={() => {
                            onRevoke(device);
                        }}
                    >
                        <Unlink aria-hidden className="size-4" />
                    </IconAction>
                </li>
            ))}
        </ul>
    );
}
