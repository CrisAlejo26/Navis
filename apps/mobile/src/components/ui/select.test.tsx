import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { Select } from '@/components/ui/select';

const OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

describe('Select', () => {
  it('muestra el placeholder sin valor, y la etiqueta elegida con él', async () => {
    const { rerender } = await render(
      <Select
        label="Idioma"
        value={null}
        options={OPTIONS}
        placeholder="Elige uno"
        onChange={jest.fn()}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Idioma' });
    expect(within(trigger).getByText('Elige uno')).toBeTruthy();

    await rerender(
      <Select
        label="Idioma"
        value="en"
        options={OPTIONS}
        placeholder="Elige uno"
        onChange={jest.fn()}
      />,
    );

    expect(within(trigger).getByText('English')).toBeTruthy();
  });

  it('llama a onChange con el valor de la opción pulsada', async () => {
    const onChange = jest.fn();
    await render(
      <Select
        label="Idioma"
        value="es"
        options={OPTIONS}
        placeholder="Elige uno"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Idioma' }));
    await fireEvent.press(screen.getByText('English'));

    expect(onChange).toHaveBeenCalledWith('en');
  });

  it('muestra el error cuando se pasa', async () => {
    await render(
      <Select
        label="Idioma"
        value={null}
        options={OPTIONS}
        placeholder="Elige uno"
        error="Elige un idioma"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Elige un idioma')).toBeTruthy();
  });
});
