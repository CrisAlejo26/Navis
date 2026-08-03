import { ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { RolesPanel } from '@/components/access/roles-panel';
import { UsersPanel } from '@/components/access/users-panel';
import { Tabs, type TabItem } from '@/components/ui/tabs';

type Tab = 'users' | 'roles';

/**
 * Administración de accesos: quién tiene cuenta y qué roles existen.
 *
 * Quién entra lo decide el permiso `users.view` en la tabla de rutas
 * (`RequirePermission`), que es el mismo que exige la API. Aquí ya no se mira
 * el rol: comparar slugs a mano fue justo lo que dejó fuera al
 * superadministrador cuando los roles se renombraron.
 *
 * La pestaña activa vive en la URL, así que se puede compartir un enlace
 * directo a los roles y el botón de atrás hace lo que se espera.
 */
export function UsersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const tab: Tab = params.get('tab') === 'roles' ? 'roles' : 'users';

  const tabs: readonly TabItem<Tab>[] = [
    { value: 'users', label: t('roles.usersTab'), icon: Users },
    { value: 'roles', label: t('roles.rolesTab'), icon: ShieldCheck },
  ];

  const changeTab = (value: Tab) => {
    // Al cambiar de pestaña se olvidan los filtros de la anterior: sus columnas
    // y sus valores no valen para la otra tabla.
    setParams(value === 'users' ? {} : { tab: value }, { replace: true });
  };

  return (
    <section className="gap-6 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('roles.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('roles.description')}</p>
      </header>

      <Tabs items={tabs} value={tab} onChange={changeTab} label={t('roles.title')} />

      {tab === 'users' ? <UsersPanel /> : <RolesPanel />}
    </section>
  );
}
