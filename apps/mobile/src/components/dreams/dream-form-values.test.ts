import type { LocalDream } from '@/data/repos/dreams-repo';

import {
    dreamFormFrom,
    emptyDreamForm,
    isDreamFormValid,
    toDreamInput,
} from '@/components/dreams/dream-form-values';

const DREAM: LocalDream = {
    id: 'a',
    title: null,
    body: 'Volaba',
    dreamedAt: '2026-03-14',
    interpretation: null,
    fulfilledAt: null,
    fulfillmentMeaning: null,
    emotions: [{ id: 'e1', slug: 'paz', name: null, accent: '#16a34a', position: 3 }],
    audios: [],
    createdAt: '2026-03-14T08:00:00.000Z',
};

describe('el formulario de sueño (D17: solo el cuerpo es obligatorio)', () => {
    it('no deja guardar sin cuerpo, aunque haya título', () => {
        expect(isDreamFormValid({ ...emptyDreamForm(), title: 'La puerta', body: '   ' })).toBe(
            false,
        );
    });

    it('deja guardar con solo el cuerpo', () => {
        expect(isDreamFormValid({ ...emptyDreamForm(), body: 'Volaba' })).toBe(true);
    });

    it('al editar parte de lo guardado y trae los identificadores de sus emociones', () => {
        const values = dreamFormFrom(DREAM);

        expect(values.title).toBe('');
        expect(values.body).toBe('Volaba');
        expect(values.emotionIds).toEqual(['e1']);
        expect(values.pendingAudios).toEqual([]);
    });

    it('el input no lleva los audios: se copian aparte, ya con el sueño creado', () => {
        const input = toDreamInput({
            ...dreamFormFrom(DREAM),
            pendingAudios: [{ uri: 'file:///a.m4a', durationSeconds: 4 }],
        });

        expect(input).toEqual({
            title: '',
            body: 'Volaba',
            dreamedAt: '2026-03-14',
            interpretation: '',
            emotionIds: ['e1'],
        });
    });
});
