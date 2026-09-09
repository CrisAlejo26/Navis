import { themeColorsHex } from '@navis/theme';
import { render } from '@testing-library/react-native';

import { LineChart } from '@/components/ui/line-chart';
import { hexAlpha } from '@/lib/color';

interface MockLineProps {
  data?: { value: number; label?: string }[];
  height?: number;
  color?: string;
  curved?: boolean;
  areaChart?: boolean;
  startFillColor?: string;
  endFillColor?: string;
  hideAxesAndRules?: boolean;
  hideYAxisText?: boolean;
}

// La librería anima la línea al montar con `Animated.timing` dentro de
// `setTimeout`s que en Jest se disparan tras el teardown del entorno. Se
// mockea y se comprueba el contrato del envoltorio: qué datos y qué colores
// de token se le pasan, que es el comportamiento que le toca a Navis.
const mockGiftedLineChart = jest.fn((_props: MockLineProps) => null);

jest.mock('react-native-gifted-charts', () => ({
  LineChart: (props: MockLineProps) => mockGiftedLineChart(props),
}));

const DATA = [
  { value: 2, label: 'L' },
  { value: 5, label: 'M' },
];

describe('LineChart', () => {
  beforeEach(() => mockGiftedLineChart.mockClear());

  it('pasa los datos con la línea en el token primary', async () => {
    await render(<LineChart data={DATA} />);

    expect(mockGiftedLineChart).toHaveBeenCalledWith(
      expect.objectContaining({
        data: DATA,
        color: themeColorsHex.light.primary,
        curved: true,
      }),
    );
  });

  it('en modo sparkline quita las etiquetas y oculta los ejes', async () => {
    await render(<LineChart data={DATA} sparkline height={40} />);

    const props = mockGiftedLineChart.mock.calls[0][0];
    expect(props.data).toEqual([{ value: 2 }, { value: 5 }]);
    expect(props.hideAxesAndRules).toBe(true);
    expect(props.hideYAxisText).toBe(true);
    expect(props.height).toBe(40);
  });

  it('con área pasa el degradado del token primary', async () => {
    await render(<LineChart data={DATA} area />);

    const props = mockGiftedLineChart.mock.calls[0][0];
    expect(props.areaChart).toBe(true);
    expect(props.startFillColor).toBe(hexAlpha(themeColorsHex.light.primary, 0.18));
    expect(props.endFillColor).toBe(hexAlpha(themeColorsHex.light.primary, 0.02));
  });
});
