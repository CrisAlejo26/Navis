/**
 * Ayuda de tests para la base local: `expo-sqlite` no existe en Jest, así que
 * el adaptador que piden los tests se apoya en **better-sqlite3 real**, en
 * memoria. Así las consultas de los repositorios se prueban contra el mismo
 * motor que corre en el teléfono, no contra un doble con otra semántica.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
/* global jest */

const Database = require('better-sqlite3');

/*
 * Los mocks van al nivel superior: este módulo tiene que ser **el primer
 * import** de cada test que toque la base local, para que los repositorios
 * carguen ya con los dobles y no con los módulos nativos.
 */

// `expo-crypto` no corre en Node: sus primitivas reales de Node implementan
// los mismos algoritmos (SHA-256, uuid v4, bytes aleatorios).
jest.mock('expo-crypto', () => {
    const nodeCrypto = require('node:crypto');
    return {
        __esModule: true,
        CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
        digestStringAsync: async (_algorithm, data) =>
            nodeCrypto.createHash('sha256').update(data, 'utf8').digest('hex'),
        getRandomBytesAsync: async (count) => nodeCrypto.randomBytes(count),
        randomUUID: () => nodeCrypto.randomUUID(),
    };
});

// SecureStore real de mentira: un mapa en memoria que sobrevive a los tests,
// donde el mock del `jest.setup.js` global no guarda nada.
jest.mock('expo-secure-store', () => {
    const store = new Map();
    return {
        __esModule: true,
        getItemAsync: async (key) => store.get(key) ?? null,
        setItemAsync: async (key, value) => {
            store.set(key, value);
        },
        deleteItemAsync: async (key) => {
            store.delete(key);
        },
    };
});

const ALL_TABLES = [
    'churches',
    'congregations',
    'calendars',
    'meeting_patterns',
    'pattern_phases',
    'believers',
    'believer_notes',
    'believer_tags',
    'believer_tag_links',
    'note_audios',
    'meetings',
    'meeting_slots',
    'ministries',
    'gifts',
    'believer_ministries',
    'believer_gifts',
    'tasks',
    'tags',
    'task_tags',
    'task_occurrences',
    'prophecies',
    'prophecy_fulfillments',
    'local_user',
];

/** Un adaptador con la interfaz mínima que usa `src/data/db.ts`. */
function makeDb(memory) {
    return {
        execAsync: (sql) => {
            memory.exec(sql);
        },
        runAsync: (sql, ...params) => {
            // expo-sqlite devuelve el resultado de la ejecución (changes, lastId):
            // los repositorios lo leen para saber cuántas filas tocaron.
            return memory.prepare(sql).run(...params);
        },
        getFirstAsync: (sql, ...params) => {
            const row = memory.prepare(sql).get(...params);
            return row === undefined ? null : row;
        },
        getAllAsync: (sql, ...params) => memory.prepare(sql).all(...params),
        withTransactionAsync: async (fn) => {
            memory.exec('BEGIN');
            try {
                await fn();
                memory.exec('COMMIT');
            } catch (error) {
                memory.exec('ROLLBACK');
                throw error;
            }
        },
    };
}

/** Abre la base local de prueba y deja el módulo `db` apuntando a ella. */
async function setupLocalDb({ setDbForTests, openDatabaseMock }) {
    const memory = new Database(':memory:');
    memory.exec('PRAGMA foreign_keys = ON');
    const adapter = makeDb(memory);
    openDatabaseMock.mockResolvedValue(adapter);
    setDbForTests(null); // fuerza a getDb a pasar por openDatabaseAsync

    const { getDb } = require('@/data/db');
    await getDb(); // aplica la migración 1 (CREATE TABLE + índices)

    return {
        adapter,
        memory,
        async clear() {
            memory.exec(ALL_TABLES.map((name) => `DELETE FROM "${name}"`).join('; '));
        },
        close() {
            memory.close();
        },
    };
}

module.exports = { setupLocalDb };
