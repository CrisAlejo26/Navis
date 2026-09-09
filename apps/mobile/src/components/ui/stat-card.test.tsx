import { render, screen } from '@testing-library/react-native';

import { StatCard } from '@/components/ui/stat-card';

describe('StatCard', () => {
  it('muestra etiqueta y valor', async () => {
    await render(<StatCard label="Creyentes" value="128" />);

    expect(screen.getByText('Creyentes')).toBeTruthy();
    expect(screen.getByText('128')).toBeTruthy();
  });

  it('muestra el indicador de cambio cuando se pasa', async () => {
    await render(
      <StatCard label="Creyentes" value="128" change={{ direction: 'up', text: '12' }} />,
    );

    expect(screen.getByText('12')).toBeTruthy();
  });

  it('no muestra indicador de cambio si no se pasa', async () => {
    await render(<StatCard label="Creyentes" value="128" />);

    expect(screen.queryByText('12')).toBeNull();
  });
});
