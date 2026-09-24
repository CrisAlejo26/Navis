import {
    Children,
    isValidElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

interface CarouselProps {
    children: ReactNode[];
    /** Ancho de cada tarjeta. */
    itemWidth: number;
    gap?: number;
    /** Se llama al cambiar de página (con el índice, 0-based). */
    onIndexChange?: (index: number) => void;
    /**
     * Autoplay: avanza una tarjeta cada tantos milisegundos y al llegar a la
     * última vuelve a la primera. Se pausa con el dedo encima — la tarjeta
     * tocada manda — y sigue al soltarlo.
     */
    autoMs?: number;
    testID?: string;
    className?: string;
}

/**
 * Carrusel de tarjetas con snap por tarjeta (Fase 12 de
 * `docs/sistema-componentes-movil-plan.md`). Es un `FlatList` horizontal —
 * nunca un `ScrollView` con `map` (Regla 5 punto 5): virtualiza las tarjetas
 * y da el snap gratis. El indicador de página es `PageDots`, que se compone
 * fuera con `onIndexChange`.
 */
export function Carousel({
    children,
    itemWidth,
    gap = 12,
    onIndexChange,
    autoMs,
    testID,
    className,
}: CarouselProps) {
    const items = Children.toArray(children).filter(isValidElement);
    const [index, setIndex] = useState(0);
    const lista = useRef<FlatList>(null);
    // El índice **de verdad** va en ref: el intervalo lo lee y lo escribe sin
    // esperar el recambio de React — el estado solo alimenta a `PageDots`.
    const indiceRef = useRef(0);
    const pausado = useRef(false);
    const snap = itemWidth + gap;

    const irA = useCallback(
        (next: number) => {
            indiceRef.current = next;
            lista.current?.scrollToOffset({ offset: snap * next, animated: true });
            setIndex(next);
            onIndexChange?.(next);
        },
        [snap, onIndexChange],
    );

    function onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const next = Math.round(event.nativeEvent.contentOffset.x / snap);
        const clamped = Math.min(Math.max(next, 0), items.length - 1);
        if (clamped !== index) {
            indiceRef.current = clamped;
            setIndex(clamped);
            onIndexChange?.(clamped);
        }
    }

    useEffect(() => {
        if (!autoMs || items.length < 2) return;
        const id = setInterval(() => {
            if (pausado.current) return;
            irA((indiceRef.current + 1) % items.length);
        }, autoMs);
        return () => clearInterval(id);
    }, [autoMs, items.length, snap, onIndexChange, irA]);

    return (
        <FlatList
            horizontal
            ref={lista}
            testID={testID}
            data={items}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
                <View style={{ width: itemWidth, marginRight: gap }}>{item}</View>
            )}
            showsHorizontalScrollIndicator={false}
            snapToInterval={snap}
            snapToAlignment="start"
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScrollBeginDrag={() => {
                pausado.current = true;
            }}
            onScrollEndDrag={() => {
                pausado.current = false;
            }}
            getItemLayout={(_, i) => ({ length: snap, offset: snap * i, index: i })}
            contentContainerClassName={className}
        />
    );
}
