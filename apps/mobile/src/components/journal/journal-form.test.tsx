import { fireEvent, render, screen } from '@testing-library/react-native';
import { JournalForm } from './journal-form';
import {
    createJournalEntry,
    updateJournalEntry,
    type LocalJournalEntry,
} from '@/data/repos/journal-repo';
import { addJournalAudio, deleteJournalAudio } from '@/data/repos/journal-audios';
import type * as ReactModule from 'react';
import type * as NativeModule from 'react-native';
import { Alert } from 'react-native';

jest.mock('@/data/repos/journal-repo', () => ({
    createJournalEntry: jest.fn(() => Promise.resolve('saved-id')),
    updateJournalEntry: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/data/repos/journal-audios', () => ({
    addJournalAudio: jest.fn(() => Promise.resolve()),
    deleteJournalAudio: jest.fn(),
}));
jest.mock('@/data/repos/dashboard-repo', () => ({ todayIso: () => '2026-10-04' }));
jest.mock('@/hooks/use-reminder-prompt', () => ({
    useAfterReminderSaved: () => jest.fn(() => Promise.resolve()),
}));
jest.mock('@/hooks/use-journal', () => ({
    useJournalMutation: (operation: (context: unknown, input: unknown) => Promise<unknown>) => ({
        mutateAsync: (input: unknown) => operation({ churchId: 'church', userId: 'owner' }, input),
    }),
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(() => ({ size: 123 })) }));
jest.mock('./journal-audio', () => {
    const React = jest.requireActual<typeof ReactModule>('react');
    const { Pressable } = jest.requireActual<typeof NativeModule>('react-native');
    return {
        JournalAudio: ({ onRemove }: { onRemove: () => void }) =>
            React.createElement(Pressable, {
                accessibilityRole: 'button',
                accessibilityLabel: 'Quitar audio de prueba',
                onPress: onRemove,
            }),
    };
});
jest.mock('@/components/believers/audio-recorder', () => {
    const React = jest.requireActual<typeof ReactModule>('react');
    const { Pressable, Text } = jest.requireActual<typeof NativeModule>('react-native');
    return {
        AudioRecorder: ({ onFinish }: { onFinish: (audio: unknown) => void }) =>
            React.createElement(
                Pressable,
                {
                    accessibilityRole: 'button',
                    accessibilityLabel: 'Grabar prueba',
                    onPress: () => onFinish({ uri: 'file:///recording.m4a', durationSeconds: 12 }),
                },
                React.createElement(Text, null, 'Grabar prueba'),
            ),
    };
});
beforeEach(() => {
    jest.clearAllMocks();
});

it('valida los campos obligatorios antes de guardar', async () => {
    await render(<JournalForm onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Ponle un título a la entrada')).toBeTruthy();
    expect(createJournalEntry).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Escribe la anotación')).toBeTruthy();
});
it('crea la entrada con título, fecha, tipo y cuerpo completo', async () => {
    const close = jest.fn();
    await render(<JournalForm onClose={close} />);
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita');
    await fireEvent.changeText(screen.getByLabelText('Anotación'), 'Conversación completa');
    await fireEvent.press(screen.getByRole('button', { name: 'Decisión' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(createJournalEntry).toHaveBeenCalledWith(
        { churchId: 'church', userId: 'owner' },
        expect.objectContaining({
            title: 'Visita',
            annotation: 'Conversación completa',
            kind: 'decision',
            occurredAt: '2026-10-04',
        }),
    );
    expect(close).toHaveBeenCalled();
});
it('edita a partir del texto completo, con reflexión y recordatorio', async () => {
    const entry = {
        id: 'entry',
        title: 'Visita',
        kind: 'oracion',
        occurredAt: '2026-10-04',
        annotation: 'Texto largo '.repeat(60).trim(),
        learned: 'Acompañar',
        remindAt: '2099-10-04T19:00:00',
        remindText: 'Llamar',
        audios: [],
    } as unknown as LocalJournalEntry;
    await render(<JournalForm entry={entry} onClose={jest.fn()} />);
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Nueva visita');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(updateJournalEntry).toHaveBeenCalledWith(
        expect.anything(),
        'entry',
        expect.objectContaining({
            title: 'Nueva visita',
            annotation: entry.annotation,
            learned: 'Acompañar',
            remindAt: '2099-10-04T19:00:00',
            remindText: 'Llamar',
        }),
    );
    expect(createJournalEntry).not.toHaveBeenCalled();
});
it('mantiene el contenido al fallar y permite reintentar', async () => {
    jest.mocked(createJournalEntry).mockRejectedValueOnce(new Error('disk'));
    const close = jest.fn();
    await render(<JournalForm onClose={close} />);
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita');
    await fireEvent.changeText(screen.getByLabelText('Anotación'), 'No perder este texto');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('No perder este texto')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(close).toHaveBeenCalled();
});
it('reintenta un audio fallido sin duplicar la entrada ya guardada', async () => {
    jest.mocked(addJournalAudio).mockRejectedValueOnce(new Error('copy-failed'));
    const close = jest.fn();
    await render(<JournalForm onClose={close} />);
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Con audio');
    await fireEvent.changeText(screen.getByLabelText('Anotación'), 'Conversación');
    await fireEvent.press(screen.getByRole('button', { name: 'Audios' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Grabar prueba' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(close).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(createJournalEntry).toHaveBeenCalledTimes(1);
    expect(updateJournalEntry).toHaveBeenCalledTimes(1);
    expect(addJournalAudio).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalled();
});

it('despliega las opciones adicionales sin perder lo aprendido al cerrarlas', async () => {
    await render(<JournalForm onClose={jest.fn()} />);
    expect(screen.queryByPlaceholderText('La reflexión sobre lo anotado…')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Lo aprendido' }));
    await fireEvent.changeText(
        screen.getByPlaceholderText('La reflexión sobre lo anotado…'),
        'Escuchar primero',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Lo aprendido' }));
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita');
    await fireEvent.changeText(screen.getByLabelText('Anotación'), 'Conversación');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(createJournalEntry).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ learned: 'Escuchar primero' }),
    );
});

it('pide confirmación antes de descartar un texto sin guardar', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const close = jest.fn();
    await render(<JournalForm onClose={close} />);
    await fireEvent.changeText(screen.getByLabelText('Anotación'), 'Borrador importante');
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(close).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Descartar cambios', expect.any(String), expect.any(Array));
    alert.mockRestore();
});

it('no elimina los audios existentes hasta que se guarda la edición', async () => {
    const entry = {
        id: 'entry',
        title: 'Visita',
        kind: 'observacion',
        occurredAt: '2026-10-04',
        annotation: 'Una conversación',
        audios: [{ id: 'audio', uri: 'file:///audio.m4a' }],
    } as unknown as LocalJournalEntry;
    await render(<JournalForm entry={entry} onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar audio de prueba' }));
    expect(deleteJournalAudio).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(deleteJournalAudio).toHaveBeenCalledWith(
        { churchId: 'church', userId: 'owner' },
        'entry',
        'audio',
    );
});
