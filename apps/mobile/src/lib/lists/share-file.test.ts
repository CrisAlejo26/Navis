import { shareListFile } from './share-file';

const mockFiles = new Set<string>();
jest.mock('expo-file-system', () => ({
    Paths: { cache: 'cache' },
    File: class {
        uri: string;
        constructor(...parts: string[]) {
            this.uri = parts.join('/');
        }
        get exists() {
            return mockFiles.has(this.uri);
        }
        delete() {
            mockFiles.delete(this.uri);
        }
        copy(destination: { uri: string }) {
            if (mockFiles.has(destination.uri)) throw new Error('destination-exists');
            mockFiles.add(destination.uri);
            throw new Error('copy-failed');
        }
    },
}));
jest.mock('expo-sharing', () => ({
    isAvailableAsync: () => Promise.resolve(true),
    shareAsync: jest.fn(),
}));
jest.mock('expo-print', () => ({
    printToFileAsync: () => Promise.resolve({ uri: 'temporary' }),
}));
beforeEach(() => mockFiles.clear());
it.each(['pdf', 'image'] as const)(
    'limpia archivos parciales y permite reintentar %s',
    async (format) => {
        const destination = `cache/navis-qa.${format === 'image' ? 'png' : 'pdf'}`;
        mockFiles.add(destination);
        mockFiles.add('temporary');
        await expect(
            shareListFile(
                { title: 'QA', headers: ['Nombre'], rows: [['Fila']] },
                'qa',
                format,
                () => Promise.resolve('temporary'),
            ),
        ).rejects.toThrow('copy-failed');
        expect(mockFiles.has(destination)).toBe(false);
        expect(mockFiles.has('temporary')).toBe(false);
    },
);
