import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { useSignOut } from '@/lib/use-sign-out';

/**
 * Para quien tiene cuenta pero su rol todavía no abre ninguna pantalla —el
 * creyente, o alguien recién dado de alta—.
 *
 * Dice de quién depende que eso cambie en vez de dejar una puerta cerrada sin
 * explicación, y no ofrece nada que no se pueda hacer desde aquí: mandarle a un
 * formulario que no puede rellenar sería peor que no decir nada.
 */
export function NoAccessPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const handleSignOut = useSignOut();

  return (
    <main className="p-6 flex min-h-dvh items-center justify-center">
      <div className="max-w-sm gap-6 flex w-full flex-col items-center text-center">
        <Logo className="h-16 w-16" />

        <div className="gap-2 flex flex-col">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{t('access.noAccessTitle')}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('access.noAccessBody')}
          </p>
        </div>

        {session?.user.email && (
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
        )}

        <Button variant="secondary" size="lg" onClick={() => void handleSignOut()}>
          <LogOut size={16} aria-hidden />
          {t('auth.signOut')}
        </Button>
      </div>
    </main>
  );
}
