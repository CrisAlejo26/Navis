import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Card({ title, description, children, className }: CardProps) {
  return (
    <View className={cn('gap-2 p-4 rounded-xl border border-border bg-card', className)}>
      {title ? <Text className="text-base font-semibold text-foreground">{title}</Text> : null}
      {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
      {children}
    </View>
  );
}
