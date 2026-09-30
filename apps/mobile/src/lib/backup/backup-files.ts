import { Directory, File, Paths } from 'expo-file-system';

import { audioUri } from '@/data/audio-storage';
import { believerPhotoUri } from '@/data/photo-storage';

import type { BackupFiles } from './backup-format';

async function read(uri: string): Promise<string | null> {
    const file = new File(uri);
    return file.exists ? file.base64() : null;
}

function write(folder: string, uri: string, base64: string): Promise<void> {
    new Directory(Paths.document, folder).create({ intermediates: true, idempotent: true });
    new File(uri).write(base64, { encoding: 'base64' });
    return Promise.resolve();
}

/** Los audios y las fotos del teléfono, en Documentos (`audios/<id>` y `photos/<id>`). */
export const deviceBackupFiles: BackupFiles = {
    audioUri,
    photoUri: believerPhotoUri,
    readAudio: (id) => read(audioUri(id)),
    readPhoto: (id) => read(believerPhotoUri(id)),
    writeAudio: (id, base64) => write('audios', audioUri(id), base64),
    writePhoto: (id, base64) => write('photos', believerPhotoUri(id), base64),
};
