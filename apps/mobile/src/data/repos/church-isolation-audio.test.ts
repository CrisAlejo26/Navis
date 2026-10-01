import { isolationSuite, rejectedOrUnchanged } from '../test-support/church-isolation-suite';
import { addAudio, deleteAudio, findNote } from './notes-repo';
const suite = isolationSuite();
beforeEach(() => jest.clearAllMocks());
const audio = {
    sourceUri: 'file:///test',
    mimeType: 'audio/m4a',
    sizeBytes: 1,
    durationSeconds: null,
    recorded: true,
};
// B2/B7: rechazar un audio ajeno sucede antes de tocar disco y base.
it.each(['deleteAudio', 'addAudio'] as const)('B2/B7: %s no toca Sur', async (operation) => {
    const { north, south } = suite.churches();
    await rejectedOrUnchanged(
        () =>
            operation === 'deleteAudio'
                ? deleteAudio(south.audioId, north.churchId)
                : addAudio(south.noteId, audio, north.churchId),
        () => suite.db().adapter.getAllAsync('SELECT * FROM note_audios ORDER BY id'),
    );
    const storage = jest.requireMock<{ removeAudioAt: jest.Mock; storeAudio: jest.Mock }>(
        '../audio-storage',
    );
    expect(storage.removeAudioAt).not.toHaveBeenCalled();
    expect(storage.storeAudio).not.toHaveBeenCalled();
});
// Control positivo: el aislamiento no inutiliza la grabación en la iglesia propia.
it('añade y elimina un audio en la iglesia correcta', async () => {
    const { north } = suite.churches();
    await addAudio(north.noteId, audio, north.churchId);
    const note = await findNote(north.noteId, north.churchId);
    expect(note?.audios).toHaveLength(2);
    const added = note?.audios.find((one) => one.id !== north.audioId);
    if (!added) throw new Error('Falta el audio creado');
    await deleteAudio(added.id, north.churchId);
    expect((await findNote(north.noteId, north.churchId))?.audios).toHaveLength(1);
});
