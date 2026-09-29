import { useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';

/** Lo que ocupan el eje Y y su aire a la izquierda de las reglas (35 de la librería y un margen). */
const AXIS = 45;

/**
 * El ancho real del recuadro donde va una gráfica. `react-native-gifted-charts`
 * no se adapta a su contenedor: las reglas miden lo que diga `width` y las barras
 * se reparten por `parentWidth`, que por defecto es el de la **pantalla**. Con
 * `width={100}` la gráfica quedaba a la mitad de su tarjeta. Hasta que llega la
 * medición se usa un ancho de pantalla razonable, para no pintar en blanco.
 */
export function useChartWidth(): {
    parentWidth: number;
    width: number;
    onLayout: (event: LayoutChangeEvent) => void;
} {
    const { width: screen } = useWindowDimensions();
    const [measured, setMeasured] = useState(0);
    const parentWidth = measured > 0 ? measured : screen - 64;

    return {
        parentWidth,
        width: Math.max(60, parentWidth - AXIS),
        onLayout: (event) => setMeasured(Math.round(event.nativeEvent.layout.width)),
    };
}
