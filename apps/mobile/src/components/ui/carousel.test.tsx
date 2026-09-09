import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

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
});
