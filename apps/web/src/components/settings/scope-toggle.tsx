import { queryKeys, useUpdateProfile } from '@navis/api-client';
import type { Profile } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

/**
 * El interruptor de alcance, solo para el superadministrador (RFC 0014).
 *
 * Al cambiarlo se invalidan las iglesias y los usuarios: son las dos
 * consultas cuyo resultado depende de esta preferencia, igual que ya pasa al
 * cambiar de iglesia activa (RFC 0008).
 */
export function ScopeToggle({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile(api);
  const queryClient = useQueryClient();

  const toggle = () => {
    updateProfile.mutate(
      { restrictOwnScope: !profile.restrictOwnScope },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.churches.all });
          void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
      },
    );
  };

  return (
    <div className="gap-4 flex items-center justify-between">
      <div className="gap-1 flex flex-col">
        <span className="text-sm font-medium">{t('settings.restrictOwnScope')}</span>
        <span className="max-w-prose text-xs text-pretty text-muted-foreground">
          {t('settings.restrictOwnScopeHint')}
        </span>
      </div>
      <Switch
        checked={profile.restrictOwnScope}
        onChange={toggle}
        disabled={updateProfile.isPending}
        aria-label={t('settings.restrictOwnScope')}
      />
    </div>
  );
}
