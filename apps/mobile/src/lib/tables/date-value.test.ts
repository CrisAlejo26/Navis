import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

it('conserva el día local en medianoche, febrero bisiesto y los dos cambios de horario de Madrid', () => {
    const source = resolve('src/lib/tables/date-value.ts');
    const script = `
        const ts = require('typescript');
        const code = ts.transpile(require('fs').readFileSync(${JSON.stringify(source)}, 'utf8'), { module: ts.ModuleKind.CommonJS });
        const api = {}; new Function('exports', code)(api);
        const input = [['2028-02-29','00:05'], ['2028-03-26','01:30'], ['2028-03-26','03:30'], ['2028-10-29','01:30'], ['2028-10-29','03:30']];
        process.stdout.write(JSON.stringify(input.map(([day,time]) => { const iso=api.combineLocalDate(day,time); return {iso,...api.localDateParts(iso)}; })));
    `;
    const result: unknown = JSON.parse(
        execFileSync('rtk', ['proxy', 'node', '-e', script], {
            env: { ...process.env, TZ: 'Europe/Madrid' },
            encoding: 'utf8',
        }),
    );
    expect(result).toEqual([
        { iso: '2028-02-28T23:05:00.000Z', day: '2028-02-29', time: '00:05' },
        { iso: '2028-03-26T00:30:00.000Z', day: '2028-03-26', time: '01:30' },
        { iso: '2028-03-26T01:30:00.000Z', day: '2028-03-26', time: '03:30' },
        { iso: '2028-10-28T23:30:00.000Z', day: '2028-10-29', time: '01:30' },
        { iso: '2028-10-29T02:30:00.000Z', day: '2028-10-29', time: '03:30' },
    ]);
});
