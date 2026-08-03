import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import { AuthLayout } from '@/components/auth/auth-layout';
import { ChurchForm } from '@/components/church-form';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useChurches } from '@/lib/churches';
import { toast } from '@/lib/toast';

/**
 * Lo primero que ve quien puede crear iglesias y todavía no tiene ninguna.
 *
 * Es bloqueante a propósito: sin iglesia no hay dónde guardar un creyente ni
 * qué enseñar en el calendario, así que en vez de dejar entrar a un panel vacío
 * se pide lo mínimo para empezar —el nombre y la ciudad— y se entra ya dentro
 * de ella.
 *
 * Reutiliza la estructura de las pantallas de acceso: es el mismo momento de la
 * aplicación, antes de tener sitio donde trabajar (Regla 1).
 */
export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, isLoading } = useChurches();

  if (isLoading) return <PageSkeleton className="max-w-5xl p-6 md:p-8 mx-auto" />;
  // Quien ya tiene iglesia no pinta nada aquí.
  if (items.length > 0) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      eyebrow={t('church.welcomeEyebrow')}
      title={t('church.welcomeTitle')}
      subtitle={t('church.welcomeSubtitle')}
    >
      <ChurchForm
        submitLabel={t('church.create')}
        onCreated={(name) => {
          toast.success(t('church.created', { name }));
          void navigate('/', { replace: true });
        }}
      />
    </AuthLayout>
  );
}
