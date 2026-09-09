import { themeColorsHex } from '@navis/theme';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { DonutChart } from '@/components/ui/donut-chart';

interface MockPieProps {
  data?: { value: number; color: string }[];
  centerLabelComponent?: () => ReactNode;
}

// La librería anima el donut al montar: se mockea y se comprueba el contrato
// del envoltorio — los tonos se resuelven a los tokens, y la etiqueta del
// centro se reenvía (la librería la invoca como función).
const mockGiftedPieChart = jest.fn((props: MockPieProps) => props.centerLabelComponent?.() ?? null);

jest.mock('react-native-gifted-charts', () => ({
  PieChart: (props: MockPieProps) => mockGiftedPieChart(props),
}));

describe('DonutChart', () => {
  beforeEach(() => mockGiftedPieChart.mockClear());

  it('resuelve cada tono a su token semántico', async () => {
    await render(
      <DonutChart
        data={[
          { value: 6, tone: 'primary' },
          { value: 2, tone: 'success' },
        ]}
      />,
    );

    expect(mockGiftedPieChart.mock.calls[0][0].data).toEqual([
      { value: 6, color: themeColorsHex.light.primary },
      { value: 2, color: themeColorsHex.light.success },
    ]);
  });

  it('muestra la etiqueta del centro', async () => {
    await render(
      <DonutChart data={[{ value: 6, tone: 'primary' }]} centerLabel={<Text>8</Text>} />,
    );

    expect(screen.getByText('8')).toBeTruthy();
  });
});
