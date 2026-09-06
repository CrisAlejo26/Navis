import { fireEvent, render, screen } from '@testing-library/react-native';

import { IconButton } from '@/components/ui/icon-button';

interface HitSlop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// `ReactTestInstance.props` tipa `any` en @testing-library/react-native — se
// acota aquí, en un solo sitio (Regla 10 §6).
function hitSlopOf(props: unknown): HitSlop {
  return (props as { hitSlop: HitSlop }).hitSlop;
}

describe('IconButton', () => {
  it('expone la etiqueta accesible, al no llevar texto al lado', async () => {
    await render(<IconButton icon="checkmark" accessibilityLabel="Confirmar" />);

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeTruthy();
  });

  it('llama a onPress al pulsar', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="checkmark" accessibilityLabel="Confirmar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no llama a onPress si está deshabilitado', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton icon="checkmark" accessibilityLabel="Confirmar" onPress={onPress} disabled />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('amplía el área táctil hasta 44 px aunque la caja visible sea menor (Regla 5)', async () => {
    await render(<IconButton icon="checkmark" accessibilityLabel="Confirmar" size="sm" />);

    const hitSlop = hitSlopOf(screen.getByRole('button', { name: 'Confirmar' }).props);

    expect(32 + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(44);
    expect(32 + hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(44);
  });
});
