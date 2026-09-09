import { render, screen } from '@testing-library/react-native';

import { NumberCard } from '@/components/ui/number-card';

describe('NumberCard', () => {
  it('muestra el valor y la etiqueta', async () => {
    await render(<NumberCard value="14" label="Días de racha" />);

    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByText('Días de racha')).toBeTruthy();
  });
});
