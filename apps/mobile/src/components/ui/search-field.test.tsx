import { fireEvent, render, screen } from '@testing-library/react-native';

import { SearchField } from '@/components/ui/search-field';

describe('SearchField', () => {
  it('no muestra el botón de limpiar sin texto', async () => {
    await render(<SearchField value="" onChangeText={jest.fn()} />);

    expect(screen.queryByRole('button', { name: 'Borrar la búsqueda' })).toBeNull();
  });

  it('limpia con onChangeText("") si no se pasa onClear', async () => {
    const onChangeText = jest.fn();
    await render(<SearchField value="creyentes" onChangeText={onChangeText} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Borrar la búsqueda' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('usa onClear en vez de onChangeText cuando se pasa', async () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();
    await render(<SearchField value="creyentes" onChangeText={onChangeText} onClear={onClear} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Borrar la búsqueda' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChangeText).not.toHaveBeenCalled();
  });
});
