import { Children, isValidElement, useState, type ReactNode } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

interface CarouselProps {
  children: ReactNode[];
  /** Ancho de cada tarjeta. */
  itemWidth: number;
  gap?: number;
  /** Se llama al cambiar de página (con el índice, 0-based). */
  onIndexChange?: (index: number) => void;
  testID?: string;
  className?: string;
}

/**
 * Carrusel de tarjetas con snap por tarjeta (Fase 12 de
 * `docs/sistema-componentes-movil-plan.md`). Es un `FlatList` horizontal —
 * nunca un `ScrollView` con `map` (Regla 5 punto 5): virtualiza las tarjetas
 * y da el snap gratis. El indicador de página es `PageDots`, que se compone
 * fuera con `onIndexChange`.
 */
export function Carousel({
  children,
  itemWidth,
  gap = 12,
  onIndexChange,
  testID,
  className,
}: CarouselProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const [index, setIndex] = useState(0);
  const snap = itemWidth + gap;

  function onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / snap);
    const clamped = Math.min(Math.max(next, 0), items.length - 1);
    if (clamped !== index) {
      setIndex(clamped);
      onIndexChange?.(clamped);
    }
  }

  return (
    <FlatList
      horizontal
      testID={testID}
      data={items}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => <View style={{ width: itemWidth, marginRight: gap }}>{item}</View>}
      showsHorizontalScrollIndicator={false}
      snapToInterval={snap}
      snapToAlignment="start"
      decelerationRate="fast"
      onMomentumScrollEnd={onMomentumScrollEnd}
      getItemLayout={(_, i) => ({ length: snap, offset: snap * i, index: i })}
      contentContainerClassName={className}
    />
  );
}
