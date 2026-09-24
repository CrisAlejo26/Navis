import { themeColorsHex } from '@navis/theme';
import { render } from '@testing-library/react-native';

import { BarChart } from '@/components/ui/bar-chart';

interface MockBarProps {
    data?: { value: number; label?: string }[];
    frontColor?: string;
    barBorderTopLeftRadius?: number;
    barBorderTopRightRadius?: number;
    showValuesAsTopLabel?: boolean;
}

// La librería anima las barras al montar con `Animated.timing` dentro de
// `setTimeout`s que en Jest se disparan tras el teardown del entorno. Se
// mockea y se comprueba el contrato del envoltorio.
const mockGiftedBarChart = jest.fn((_props: MockBarProps) => null);

jest.mock('react-native-gifted-charts', () => ({
    BarChart: (props: MockBarProps) => mockGiftedBarChart(props),
}));

const DATA = [
    { value: 2, label: 'L' },
    { value: 5, label: 'M' },
];

describe('BarChart', () => {
    beforeEach(() => mockGiftedBarChart.mockClear());

    it('pasa los datos con las barras en el token primary', async () => {
        await render(<BarChart data={DATA} />);

        expect(mockGiftedBarChart).toHaveBeenCalledWith(
            expect.objectContaining({
                data: DATA,
                frontColor: themeColorsHex.light.primary,
                barBorderTopLeftRadius: 4,
                barBorderTopRightRadius: 4,
            }),
        );
    });

    it('con showValues pinta los valores encima', async () => {
        await render(<BarChart data={DATA} showValues />);

        expect(mockGiftedBarChart.mock.calls[0][0].showValuesAsTopLabel).toBe(true);
    });
});
