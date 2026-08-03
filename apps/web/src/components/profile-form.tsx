import type { Profile, UpdateProfileInput } from '@navis/shared';
import type { UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimezoneSelect } from '@/components/ui/timezone-select';
import { useSession } from '@/lib/auth-client';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Los datos de quien ha entrado: los suyos y solo los suyos.
 *
 * El nombre y el correo salen de la sesión y no se editan aquí —los gestiona
 * Better Auth—, así que se enseñan como lo que son: la identidad con la que se
 * ha entrado. Lo editable es lo de la tabla `profiles`.
 *
 * La iglesia ya no es un campo del perfil: es un espacio de trabajo con su
 * propia pantalla (RFC 0008), no un texto que cada cual escribe a su manera.
 */
export function ProfileForm({
  profile,
  update,
}: {
  profile: Profile | null;
  update: UseMutationResult<Profile, Error, UpdateProfileInput>;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <form
      className="gap-4 flex flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        update.mutate(
          {
            phone: formText(form.get('phone')),
            city: formText(form.get('city')),
            bio: formText(form.get('bio')),
            timezone: formText(form.get('timezone')),
          },
          {
            onSuccess: () => {
              toast.success(t('profile.saved'));
            },
            onError: () => {
              toast.error(t('errors.generic'));
            },
          },
        );
      }}
    >
      <dl className="gap-1 p-3 text-sm flex flex-col rounded-lg bg-muted/40">
        <div className="gap-3 flex justify-between">
          <dt className="text-muted-foreground">{t('auth.name')}</dt>
          <dd className="font-medium truncate">{session?.user.name}</dd>
        </div>
        <div className="gap-3 flex justify-between">
          <dt className="text-muted-foreground">{t('auth.email')}</dt>
          <dd className="truncate">{session?.user.email}</dd>
        </div>
      </dl>

      <Input
        name="phone"
        type="tel"
        label={t('profile.phone')}
        defaultValue={profile?.phone ?? ''}
        autoComplete="tel"
      />
      <Input
        name="city"
        label={t('profile.city')}
        defaultValue={profile?.city ?? ''}
        autoComplete="address-level2"
        hint={t('profile.cityHint')}
      />
      <Input
        name="bio"
        label={t('profile.bio')}
        defaultValue={profile?.bio ?? ''}
        autoComplete="off"
      />
      <TimezoneSelect
        name="timezone"
        label={t('profile.timezone')}
        defaultValue={profile?.timezone ?? 'Europe/Madrid'}
      />

      <div>
        <Button type="submit" isLoading={update.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
