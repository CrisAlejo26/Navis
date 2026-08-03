import { useProfile, useUpdateProfile } from '@fidus/api-client';
import { useTranslation } from 'react-i18next';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

/** Un campo de FormData puede ser un File; aquí solo interesan los de texto. */
const text = (value: FormDataEntryValue | null): string => (typeof value === 'string' ? value : '');

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile(api);
  const updateProfile = useUpdateProfile(api);

  return (
    <section className="max-w-2xl gap-6 flex flex-col">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

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
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : (
          <form
            className="gap-4 flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateProfile.mutate({
                church: text(form.get('church')),
                timezone: text(form.get('timezone')),
              });
            }}
          >
            <Input name="church" label={t('profile.church')} defaultValue={profile?.church ?? ''} />
            <Input
              name="timezone"
              label={t('profile.timezone')}
              defaultValue={profile?.timezone ?? 'Europe/Madrid'}
            />
            <div className="gap-3 flex items-center">
              <Button type="submit" disabled={updateProfile.isPending}>
                {t('common.save')}
              </Button>
              {updateProfile.isSuccess && (
                <span className="text-sm text-success">{t('profile.saved')}</span>
              )}
            </div>
          </form>
        )}
      </Card>
    </section>
  );
}
