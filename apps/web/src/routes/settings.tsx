import { useProfile, useUpdateProfile } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShipLoader } from '@/components/ui/ship-loader';
import { TimezoneSelect } from '@/components/ui/timezone-select';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile(api);
  const updateProfile = useUpdateProfile(api);

  return (
    <section className="gap-6 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('settings.title')}</h1>
      </header>

      {/* Dos columnas en pantalla ancha: la página aprovecha todo el ancho como
          el resto, y las tarjetas no se estiran hasta ser ilegibles. */}
      <div className="gap-6 lg:grid-cols-2 grid items-start">
        <Card className="gap-4 flex flex-col">
          <div>
            <CardTitle className="text-base">{t('settings.appearance')}</CardTitle>
            <CardDescription>{t('theme.label')}</CardDescription>
          </div>
          <div className="gap-6 flex flex-wrap items-center">
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </Card>

        <Card className="gap-4 flex flex-col">
          <CardTitle className="text-base">{t('profile.title')}</CardTitle>

          {isLoading ? (
            <ShipLoader size="sm" label={t('common.loading')} className="py-6" />
          ) : (
            <form
              className="gap-4 flex flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                updateProfile.mutate(
                  {
                    church: formText(form.get('church')),
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
              <Input
                name="church"
                label={t('profile.church')}
                defaultValue={profile?.church ?? ''}
              />
              <TimezoneSelect
                name="timezone"
                label={t('profile.timezone')}
                defaultValue={profile?.timezone ?? 'Europe/Madrid'}
              />
              <div>
                <Button type="submit" isLoading={updateProfile.isPending}>
                  {t('common.save')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
}
