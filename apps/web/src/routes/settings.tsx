import { useProfile, useUpdateProfile } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { LanguageSelect } from '@/components/language-select';
import { ProfileForm } from '@/components/profile-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

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
          <div>
            <CardTitle className="text-base">{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.description')}</CardDescription>
          </div>

          {isLoading ? (
            <FormSkeleton fields={3} />
          ) : (
            <ProfileForm profile={profile ?? null} update={updateProfile} />
          )}
        </Card>
      </div>
    </section>
  );
}
