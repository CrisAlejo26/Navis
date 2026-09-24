import type { ProphecyFulfillment } from '@navis/shared';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { formatDay } from '@/lib/format';

interface ProphecyFulfillmentCardProps {
  fulfillment: ProphecyFulfillment;
  onPress: () => void;
}

/** Una tarjeta por cumplimiento, en la ficha: fecha + texto, con su marca. */
export function ProphecyFulfillmentCard({ fulfillment, onPress }: ProphecyFulfillmentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="gap-0.5 p-3 gap-3 rounded-2xl flex-row items-start border border-border bg-card active:opacity-80"
    >
      <Icon name="checkmark-done-outline" size="sm" tone="success" background="soft" />
      <View className="gap-0.5 min-w-0 flex-1">
        <Text className="text-xs font-sans-medium text-muted-foreground">
          {formatDay(fulfillment.occurredAt)}
        </Text>
        <Text className="text-sm text-foreground">{fulfillment.text}</Text>
      </View>
    </Pressable>
  );
}
