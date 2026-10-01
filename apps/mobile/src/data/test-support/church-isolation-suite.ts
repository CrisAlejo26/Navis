import { setupLocalDb } from '../test-support';
import { setDbForTests } from '../db';
import { openDatabaseAsync } from 'expo-sqlite';
import { seedTwoChurches } from './seed-two-churches';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.mock('../audio-storage', () => ({
    audioUri: (id: string) => `file:///${id}`,
    storeAudio: jest.fn((id: string) => Promise.resolve(`file:///${id}`)),
    removeAudioAt: jest.fn(),
}));

export function isolationSuite(): {
    db: () => Awaited<ReturnType<typeof setupLocalDb>>;
    churches: () => Awaited<ReturnType<typeof seedTwoChurches>>;
} {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let churches: Awaited<ReturnType<typeof seedTwoChurches>>;
    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await db.clear();
        churches = await seedTwoChurches();
    });
    afterAll(() => db.close());
    return { db: () => db, churches: () => churches };
}

export async function rejectedOrUnchanged(
    action: () => Promise<unknown>,
    snapshot: () => Promise<unknown>,
): Promise<void> {
    const before = await snapshot();
    try {
        await action();
    } catch {
        /* Rechazar también es aislamiento válido. */
    }
    expect(await snapshot()).toEqual(before);
}
