import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { BodyText } from '@/components/ui/text';
import { Title } from '@/components/ui/title';
import { cn } from '@/lib/cn';
import type { IoniconName } from '@/lib/nav-mobile';

interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

/**
 * El «no hay nada aquí» de un listado vacío (Fase 13 §18.2). Referencias:
 * Mela y UGLYCASH — icono grande + mensaje centrado, sin ilustración propia
 * (aquí no hay ficheros de ilustración y un emoji está proscrito, Regla 9);
 * la acción opcional es el empujón de la primera creación. Es distinto de
 * `PlaceholderScreen`, que anuncia una sección sin implementar.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn('gap-2 py-10 items-center', className)}>
      {icon ? <Icon name={icon} size="lg" tone="primary" background="soft" shape="square" /> : null}
      <Title size="md" className="text-center">
        {title}
      </Title>
      {description ? (
        <BodyText className="text-center text-muted-foreground">{description}</BodyText>
      ) : null}
      {action ? <Button title={action.label} size="sm" onPress={action.onPress} /> : null}
    </View>
  );
}
