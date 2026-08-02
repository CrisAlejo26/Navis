import { useProfile, useUpdateProfile } from '@pastortools/api-client';
import { useTranslation } from 'react-i18next';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile(api);
  const updateProfile = useUpdateProfile(api);

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle className="text-base">{t('settings.appearance')}</CardTitle>
          <CardDescription>{t('theme.label')}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <ThemeToggle />
          <LanguageSelect />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle className="text-base">{t('profile.title')}</CardTitle>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateProfile.mutate({
                church: String(form.get('church') ?? ''),
                timezone: String(form.get('timezone') ?? ''),
              });
            }}
          >
            <Input name="church" label={t('profile.church')} defaultValue={profile?.church ?? ''} />
            <Input
              name="timezone"
              label={t('profile.timezone')}
              defaultValue={profile?.timezone ?? 'Europe/Madrid'}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateProfile.isPending}>
                {t('common.save')}
              </Button>
              {updateProfile.isSuccess && (
                <span className="text-success text-sm">{t('profile.saved')}</span>
              )}
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
