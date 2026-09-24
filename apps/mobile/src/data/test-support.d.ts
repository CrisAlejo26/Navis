import type { LocalDb } from './db';

/**
 * Contrato del doble de `expo-sqlite` que construye `test-support.js`:
 * better-sqlite3 real, en memoria, con la interfaz mínima de `LocalDb` que
 * usan los repositorios. Los tests lo consumen tipado — sin esto, `db` es
 * `any` y el lint de tipos se queja.
 */
export type LocalDbTestAdapter = Pick<
    LocalDb,
    'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync' | 'withTransactionAsync'
>;

export interface TestLocalDb {
    adapter: LocalDbTestAdapter;
    memory: {
        exec(sql: string): void;
        prepare(sql: string): { run(...params: unknown[]): unknown };
        close(): void;
    };
    clear(): Promise<void>;
    close(): void;
}

export function setupLocalDb(options: {
    setDbForTests(fake: LocalDb | null): void;
    /** El `openDatabaseAsync` simulado por `jest.mock` — su tipo real no se ve desde tsc. */
    openDatabaseMock: unknown;
}): Promise<TestLocalDb>;
