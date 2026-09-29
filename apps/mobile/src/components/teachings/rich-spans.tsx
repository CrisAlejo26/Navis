import { Text } from 'react-native';

import { spanStyle } from '@/lib/teachings/span-style';
import type { Run } from '@/lib/teachings/runs';

/**
 * Los tramos de un texto con formato, como hijos de un `<Text>` o de un
 * `<TextInput>`. Cada tramo lleva su propia familia (negrita, cursiva o las
 * dos); el color y el tamaño los pone quien lo envuelve.
 */
export function RichSpans({ runs }: { runs: readonly Run[] }) {
    return (
        <>
            {runs.map((run, index) => (
                <Text key={index} style={spanStyle(run)}>
                    {run.text}
                </Text>
            ))}
        </>
    );
}
