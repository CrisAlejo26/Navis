import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
it('el cuaderno usa tokens y familias completas, sin colores ni pesos sueltos', () => {
    for (const file of readdirSync(__dirname).filter(
        (name) => /\.tsx?$/.test(name) && !/\.test\./.test(name),
    )) {
        const source = readFileSync(join(__dirname, file), 'utf8');
        expect(source).not.toMatch(/#[\da-f]{3,8}\b/i);
        expect(source).not.toMatch(/fontWeight\s*:/);
        expect(source).not.toMatch(/\bany\b/);
        expect(source).not.toMatch(/Alert\.alert|<Modal\b/);
    }
});
it('las acciones del cuaderno usan confirmaciones de la app', () => {
    for (const file of ['use-journal-actions.ts', 'use-journal-detail.ts', 'use-journal-form.ts']) {
        expect(readFileSync(join(__dirname, '../../hooks', file), 'utf8')).not.toContain('Alert');
    }
});
it('las consultas nuevas del calendario incluyen iglesia y usuario', () => {
    const source = readFileSync(join(__dirname, '../../hooks/use-journal-calendar.ts'), 'utf8');
    expect(source).toContain('scope.context.churchId');
    expect(source).toContain('scope.context.userId');
    expect(source).toContain('listJournal(scope.context');
});
