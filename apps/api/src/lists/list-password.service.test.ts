import { generateListPassword } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { ListPasswordService } from './list-password.service';

const passwords = new ListPasswordService();

describe('la contraseña de un acceso', () => {
  it('guarda los parámetros dentro del hash, para poder subirlos algún día', async () => {
    const hash = await passwords.hash('k7fr-m3np-t9wx');
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[^$]+\$[^$]+$/);
  });

  it('no guarda la contraseña en claro por ninguna parte', async () => {
    expect(await passwords.hash('k7fr-m3np-t9wx')).not.toContain('k7fr');
  });

  it('usa una sal por acceso: la misma contraseña da dos hashes distintos', async () => {
    const uno = await passwords.hash('k7fr-m3np-t9wx');
    const otro = await passwords.hash('k7fr-m3np-t9wx');
    expect(uno).not.toBe(otro);
  });

  it('acepta la contraseña buena', async () => {
    const hash = await passwords.hash('k7fr-m3np-t9wx');
    expect(await passwords.verify('k7fr-m3np-t9wx', hash)).toBe(true);
  });

  it('entra igual escrita con guiones que sin ellos (D25)', async () => {
    const hash = await passwords.hash('k7fr-m3np-t9wx');
    expect(await passwords.verify('k7frm3npt9wx', hash)).toBe(true);
    expect(await passwords.verify('k7fr m3np t9wx', hash)).toBe(true);
  });

  it('rechaza la que no es', async () => {
    const hash = await passwords.hash('k7fr-m3np-t9wx');
    expect(await passwords.verify('k7fr-m3np-t9wy', hash)).toBe(false);
    expect(await passwords.verify('', hash)).toBe(false);
  });

  it('devuelve falso cuando el usuario no existe, comparando contra un señuelo', async () => {
    expect(await passwords.verify('lo-que-sea', null)).toBe(false);
  });

  it('tarda parecido con usuario que existe y con usuario que no (D24)', async () => {
    const hash = await passwords.hash(generateListPassword());

    const medir = async (stored: string | null) => {
      const desde = process.hrtime.bigint();
      await passwords.verify('k7fr-m3np-t9wx', stored);
      return Number(process.hrtime.bigint() - desde) / 1e6;
    };

    // Se calientan las dos ramas antes de medir: la primera llamada con `null`
    // deriva además el señuelo, y eso no es lo que se quiere comparar.
    await medir(hash);
    await medir(null);

    const conUsuario = await medir(hash);
    const sinUsuario = await medir(null);
    const mayor = Math.max(conUsuario, sinUsuario);
    const menor = Math.min(conUsuario, sinUsuario);

    expect(mayor / Math.max(menor, 0.001)).toBeLessThan(3);
  });

  it('rechaza un hash con una forma que no reconoce, en vez de reventar', async () => {
    expect(await passwords.verify('k7fr-m3np-t9wx', 'bcrypt$loquesea')).toBe(false);
    expect(await passwords.verify('k7fr-m3np-t9wx', '')).toBe(false);
  });
});
