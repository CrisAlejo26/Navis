import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FlatList, Text, View } from 'react-native';

import { Carousel } from '@/components/ui/carousel';

describe('Carousel', () => {
  it('muestra sus tarjetas', async () => {
    await render(
      <Carousel itemWidth={200}>
        <View testID="a">
          <Text>Primera</Text>
        </View>
        <View testID="b">
          <Text>Segunda</Text>
        </View>
      </Carousel>,
    );

    expect(screen.getByText('Primera')).toBeTruthy();
    expect(screen.getByText('Segunda')).toBeTruthy();
  });

  it('notifica el índice al hacer snap', async () => {
    const onIndexChange = jest.fn();
    await render(
      <Carousel itemWidth={200} gap={12} testID="carousel" onIndexChange={onIndexChange}>
        <View testID="a" />
        <View testID="b" />
      </Carousel>,
    );

    await fireEvent(screen.getByTestId('carousel'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 212 } },
    });

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('con autoplay avanza solo y avisa de cada cambio', async () => {
    jest.useFakeTimers();
    const onIndexChange = jest.fn();
    const advance = jest.spyOn(FlatList.prototype, 'scrollToOffset');

    await render(
      <Carousel itemWidth={200} gap={12} autoMs={4000} onIndexChange={onIndexChange}>
        <View testID="a" />
        <View testID="b" />
        <View testID="c" />
      </Carousel>,
    );

    await act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(advance).toHaveBeenCalledWith({ offset: 212, animated: true });

    // Tres ticks más: 2, 0 (vuelve), 1 — el carrusel da la vuelta entera.
    await act(() => {
      jest.advanceTimersByTime(12000);
    });
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(onIndexChange).toHaveBeenCalledWith(0);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    jest.useRealTimers();
  });

  it('el autoplay se detiene con el dedo encima y sigue al soltarlo', async () => {
    jest.useFakeTimers();
    const onIndexChange = jest.fn();

    await render(
      <Carousel
        itemWidth={200}
        gap={12}
        autoMs={4000}
        testID="carousel"
        onIndexChange={onIndexChange}
      >
        <View testID="a" />
        <View testID="b" />
      </Carousel>,
    );

    await fireEvent(screen.getByTestId('carousel'), 'scrollBeginDrag');
    await act(() => {
      jest.advanceTimersByTime(12000);
    });
    expect(onIndexChange).not.toHaveBeenCalled();

    await fireEvent(screen.getByTestId('carousel'), 'scrollEndDrag', {
      nativeEvent: { contentOffset: { x: 0 } },
    });
    await act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(onIndexChange).toHaveBeenCalledWith(1);

    jest.useRealTimers();
  });
});
