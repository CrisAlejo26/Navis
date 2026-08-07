import { useProfile, useUpdateProfile } from '@navis/api-client';
import { SUPERADMIN_ROLE } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { LanguageSelect } from '@/components/language-select';
import { ProfileForm } from '@/components/profile-form';
import { ChurchSettings } from '@/components/settings/church-settings';
import { ScopeToggle } from '@/components/settings/scope-toggle';
import { SettingsSection } from '@/components/settings/settings-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card } from '@/components/ui/card';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { useChurches } from '@/lib/churches';
import { usePermissions } from '@/lib/permissions';

/**
 * Los ajustes, **de fuera hacia dentro**: primero la iglesia, que la ve toda la
 * congregación; después tu ficha, que ven los que trabajan contigo; y al final
 * el aspecto, que solo te afecta a ti y solo en este aparato.
 *
 * Ese es el orden y no el alfabético: cuando alguien entra aquí a cambiar algo,
 * lo que busca casi siempre es lo primero, y lo de abajo es lo que se toca una
 * vez y se olvida.
 */
export function SettingsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { data: profile, isLoading } = useProfile(api);
  const updateProfile = useUpdateProfile(api);
  const { active, isLoading: cargandoIglesia } = useChurches();
  const { can } = usePermissions();

  return (
    <section className="gap-10 max-w-5xl flex flex-col">
      <header className="gap-2 flex flex-col">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('settings.title')}</h1>
        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </header>

      {/*
       * Solo para el superadministrador, y primera: decide qué significa todo
       * lo que viene después (RFC 0014).
       */}
      {session?.user.role === SUPERADMIN_ROLE && profile && (
        <>
          <SettingsSection
            eyebrow={t('settings.scopeGlobal')}
            title={t('settings.superadminScope')}
            description={t('settings.superadminScopeHint')}
          >
            <Card>
              <ScopeToggle profile={profile} />
            </Card>
          </SettingsSection>

          <hr className="border-border/60" />
        </>
      )}

      {/*
       * Sin iglesia activa la sección **no sale**, en vez de quedarse en un
       * esqueleto que no se va a rellenar nunca: no hay ficha que editar, y
       * una carga eterna hace pensar que algo está roto.
       */}
      {(cargandoIglesia || active) && (
        <>
          <SettingsSection
            eyebrow={t('settings.scopeChurch')}
            title={t('settings.church')}
            description={t('settings.churchHint')}
          >
            {active ? (
              <ChurchSettings church={active} canEdit={can('churches.manage')} />
            ) : (
              <Card>
                <FormSkeleton fields={3} />
              </Card>
            )}
          </SettingsSection>

          <hr className="border-border/60" />
        </>
      )}

      <SettingsSection
        eyebrow={t('settings.scopeYou')}
        title={t('profile.title')}
        description={t('profile.description')}
      >
        <Card>
          {isLoading ? (
            <FormSkeleton fields={3} />
          ) : (
            <ProfileForm profile={profile ?? null} update={updateProfile} />
          )}
        </Card>
      </SettingsSection>

      <hr className="border-border/60" />

      <SettingsSection
        eyebrow={t('settings.scopeDevice')}
        title={t('settings.appearance')}
        description={t('settings.appearanceHint')}
      >
        <Card className="gap-6 flex flex-wrap items-center">
          <ThemeToggle />
          <LanguageSelect />
        </Card>
      </SettingsSection>
    </section>
  );
}
