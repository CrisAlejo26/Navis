import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from '@/components/ui/chip';

describe('Chip', () => {
  it('dispara onPress al pulsarlo', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Jóvenes" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Jóvenes' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no dispara nada deshabilitado', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Jóvenes" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Jóvenes' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Jóvenes' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('expone la selección al lector de pantalla', async () => {
    await render(<Chip label="Jóvenes" selected onPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Jóvenes' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('la «x» quita sin marcar', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await render(
      <Chip label="Jóvenes" onPress={onPress} onRemove={onRemove} removeLabel="Quitar" />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Quitar' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
