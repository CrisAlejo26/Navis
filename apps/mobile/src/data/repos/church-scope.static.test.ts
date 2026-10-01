import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { unscopedChurchSql } from '../test-support/church-sql-audit';

// I2: los módulos futuros heredan esta barrera, incluidas tablas hijas y SQL interpolado.
it('toda sentencia sobre datos de iglesia exige ámbito o excepción documentada', () => {
    const violations = readdirSync(__dirname)
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
        .flatMap((file) => unscopedChurchSql(readFileSync(join(__dirname, file), 'utf8'), file));
    expect(violations).toEqual([]);
});
// El vigilante debe rechazar proyecciones, JOINs sin contexto y tablas dinámicas.
it.each([
    "db.getAllAsync('SELECT church_id FROM believers WHERE id = ?', id)",
    "db.getAllAsync('SELECT b.id FROM believers b JOIN gifts g ON g.church_id = b.church_id')",
    'db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id)',
    "const FROM = 'FROM believer_notes'; db.getAllAsync(`SELECT id ${FROM} WHERE id = ?`, id)",
])('el auditor detecta SQL sin iglesia: %s', (content) => {
    expect(unscopedChurchSql(content, 'new-repo.ts')).toHaveLength(1);
});
it.each([
    "db.getAllAsync('SELECT id FROM believers WHERE church_id = ?', churchId)",
    "db.getAllAsync('SELECT id FROM meeting_slots WHERE meeting_id IN (SELECT id FROM meetings WHERE church_id = ?)', churchId)",
    "db.getAllAsync('SELECT id FROM prophecies WHERE owner_id = ?', ownerId)",
])('el auditor permite SQL acotado o personal: %s', (content) => {
    expect(unscopedChurchSql(content, 'new-repo.ts')).toEqual([]);
});
