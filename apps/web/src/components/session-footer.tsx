import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import { useSignOut } from '@/lib/use-sign-out';

/** Quién ha entrado y el botón de salir. Va al pie de la navegación, en los dos tamaños. */
export function SessionFooter({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const handleSignOut = useSignOut();

  return (
    <div className="pt-3 border-t">
      {!collapsed && session?.user.name && (
        <p className="mb-2 px-3 text-xs truncate text-muted-foreground">{session.user.name}</p>
      )}
      <Button
        variant="ghost"
        aria-label={collapsed ? t('auth.signOut') : undefined}
        className={cn('w-full', collapsed ? 'px-0 justify-center' : 'justify-start')}
        onClick={() => void handleSignOut()}
      >
        <LogOut size={16} aria-hidden />
        {!collapsed && t('auth.signOut')}
      </Button>
    </div>
  );
}
