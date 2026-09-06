import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components/ui/icon';

/**
 * Lo único que merece test aquí es la decisión de accesibilidad (Regla 4
 * §5): el tamaño y el tinte son estilo. Con etiqueta se anuncia; sin ella,
 * se oculta para no leerse dos veces junto al texto que ya lo acompaña.
 */
describe('Icon', () => {
  it('expone accessibilityLabel cuando el icono va solo, sin texto al lado', async () => {
    await render(<Icon name="checkmark" accessibilityLabel="Correcto" />);
    expect(screen.getByLabelText('Correcto')).toBeTruthy();
  });

  it('se oculta del lector de pantalla cuando no lleva etiqueta', async () => {
    await render(<Icon name="checkmark" />);
    expect(screen.queryAllByLabelText(/.+/)).toHaveLength(0);
  });
});
