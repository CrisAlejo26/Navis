import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
  CustomTable,
  CustomTableColumn,
  CustomTableRow,
  CustomTableView,
  CustomTableWithColumns,
  ExportResponse,
  Paginated,
  RowData,
} from '@navis/shared';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';
import { ChurchClockService } from '../src/churches/church-clock.service';

const body = <T>(response: { body: unknown }): T => response.body as T;

/**
 * Tablas personalizadas (RFC 0021): columnas dinámicas, filas en JSON,
 * contraseñas cifradas, paginación, orden y filtros — lo que depende del
 * motor (`json_extract`/`->>`, `CAST`) es justo lo que no se puede probar con
 * dobles.
 *
 * Las rutas de columna van por **identificador** (`:cid`); la `key` es lo que
 * se guarda dentro del JSON de cada fila (D7) y es lo que se usa en `data`,
 * en `sort` y en los filtros — nunca en la URL.
 */
describe('Tablas personalizadas (e2e)', () => {
  let app: NestExpressApplication;
  const email = `tablas-${String(Date.now())}@navis.test`;
  const password = 'Rebano2026Seguro';
  let cookie = '';
  let churchId = '';
  let today = '';

  const post = (path: string, payload: object) =>
    request(app.getHttpServer()).post(path).set('Cookie', cookie).send(payload);
  const get = (path: string) => request(app.getHttpServer()).get(path).set('Cookie', cookie);
  const patch = (path: string, payload: object) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(payload);
  const put = (path: string, payload: object) =>
    request(app.getHttpServer()).put(path).set('Cookie', cookie).send(payload);
  const del = (path: string) => request(app.getHttpServer()).delete(path).set('Cookie', cookie);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .send({ email, password, name: 'Quien lleva la tabla' })
      .expect(200);

    const dataSource = app.get(DataSource);
    const marca = dataSource.options.type === 'postgres' ? '$1' : '?';
    await dataSource.query(`UPDATE "user" SET "role" = 'superadmin' WHERE "email" = ${marca}`, [
      email,
    ]);

    const entrada = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);

    const setCookie = entrada.headers['set-cookie'];
    cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).join('; ');

    const iglesia = await post('/api/v1/churches', {
      name: `Iglesia ${String(Date.now())}`,
      city: 'Elda',
    }).expect(201);
    churchId = body<{ id: string }>(iglesia).id;

    today = await app.get(ChurchClockService).today(churchId);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sin sesión, nada responde (guard global)', async () => {
    await request(app.getHttpServer()).get('/api/v1/tables').expect(401);
  });

  describe('la tabla y sus columnas', () => {
    let tableId = '';
    // La key: lo que se usa dentro de `data`, en `sort` y en los filtros.
    let colNombre = '';
    let colAsistio = '';
    let colClave = '';
    let colEstado = '';
    let colFecha = '';
    let colCantidad = '';
    // El identificador: lo que se usa en la URL de columnas (`:cid`).
    let colNombreId = '';
    let colAsistioId = '';

    it('se crea vacía, con icono y color, y un slug propio', async () => {
      const creada = await post('/api/v1/tables', {
        name: 'Asistencia a la lectura',
        icon: 'book-open',
        accent: '#2140cf',
      }).expect(201);
      const table = body<CustomTable>(creada);
      tableId = table.id;
      expect(table.slug).toBe('asistencia-a-la-lectura');
      expect(table.isActive).toBe(true);
    });

    it('no se repite el nombre en la misma iglesia', async () => {
      await post('/api/v1/tables', { name: 'Asistencia a la lectura', icon: 'book' }).expect(400);
    });

    it('añade columnas de varios tipos, cada una con su key estable', async () => {
      const nombre = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, {
          label: 'Nombre',
          type: 'text',
          required: true,
        }),
      );
      colNombre = nombre.key;
      colNombreId = nombre.id;

      const asistio = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, { label: 'Asistió', type: 'checkbox' }),
      );
      colAsistio = asistio.key;
      colAsistioId = asistio.id;

      colFecha = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, { label: 'Fecha', type: 'date' }),
      ).key;
      colCantidad = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, { label: 'Cantidad', type: 'number' }),
      ).key;
      colClave = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, {
          label: 'Clave del salón',
          type: 'password',
        }),
      ).key;

      const estado = body<CustomTableColumn>(
        await post(`/api/v1/tables/${tableId}/columns`, {
          label: 'Estado',
          type: 'single_select',
          options: [{ label: 'Al día' }, { label: 'Atrasado' }],
        }),
      );
      colEstado = estado.key;
      expect(estado.options).toHaveLength(2);
      expect(estado.options?.[0]?.value).toBe('al-dia');

      const ficha = body<CustomTableWithColumns>(await get(`/api/v1/tables/${tableId}`));
      expect(ficha.columns).toHaveLength(6);
    });

    it('reordena las columnas de golpe', async () => {
      const ficha = body<CustomTableWithColumns>(await get(`/api/v1/tables/${tableId}`));
      const invertido = [...ficha.columns].reverse().map((one) => one.id);

      const reordenadas = body<CustomTableColumn[]>(
        await put(`/api/v1/tables/${tableId}/columns/order`, { columnIds: invertido }),
      );
      expect(reordenadas.map((one) => one.id)).toEqual(invertido);
    });

    it('renombrar una columna no toca su key', async () => {
      const editada = body<CustomTableColumn>(
        await patch(`/api/v1/tables/${tableId}/columns/${colNombreId}`, {
          label: 'Nombre completo',
        }),
      );
      expect(editada.key).toBe(colNombre);
      expect(editada.label).toBe('Nombre completo');
    });

    describe('las filas', () => {
      let rowId = '';

      it('exige el valor de una columna obligatoria (400)', async () => {
        await post(`/api/v1/tables/${tableId}/rows`, { data: {} }).expect(400);
      });

      it('rechaza un valor que no encaja con el tipo (400)', async () => {
        await post(`/api/v1/tables/${tableId}/rows`, {
          data: { [colNombre]: 'Ana', [colAsistio]: 'sí' },
        }).expect(400);
      });

      it('crea una fila válida, y cifra la contraseña', async () => {
        const creada = await post(`/api/v1/tables/${tableId}/rows`, {
          data: {
            [colNombre]: 'Ana',
            [colAsistio]: true,
            [colFecha]: today,
            [colCantidad]: 12,
            [colEstado]: 'al-dia',
            [colClave]: 'portal-2026',
          },
        }).expect(201);

        const row = body<CustomTableRow>(creada);
        rowId = row.id;
        expect(row.data[colNombre]).toBe('Ana');
        // La contraseña nunca sale en claro en un listado (D22).
        expect(row.data[colClave]).toBe(true);
        expect(row.mismatches).toEqual([]);
      });

      it('revela la contraseña en claro con el endpoint dedicado (D22)', async () => {
        const revelada = await get(
          `/api/v1/tables/${tableId}/rows/${rowId}/reveal/${colClave}`,
        ).expect(200);
        expect(body<{ value: string }>(revelada).value).toBe('portal-2026');
      });

      it('editar sin tocar la contraseña la conserva (fusión, no reemplazo)', async () => {
        await patch(`/api/v1/tables/${tableId}/rows/${rowId}`, {
          data: { [colNombre]: 'Ana María' },
        }).expect(200);

        const revelada = await get(
          `/api/v1/tables/${tableId}/rows/${rowId}/reveal/${colClave}`,
        ).expect(200);
        expect(body<{ value: string }>(revelada).value).toBe('portal-2026');
      });

      it('pagina, busca y ordena numéricamente por una columna dinámica (D15)', async () => {
        await post(`/api/v1/tables/${tableId}/rows`, {
          data: { [colNombre]: 'Berta', [colCantidad]: 2, [colEstado]: 'atrasado' },
        }).expect(201);
        await post(`/api/v1/tables/${tableId}/rows`, {
          data: { [colNombre]: 'Carlos', [colCantidad]: 100, [colEstado]: 'al-dia' },
        }).expect(201);

        const pagina = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?limit=2`),
        );
        expect(pagina.total).toBe(3);
        expect(pagina.items).toHaveLength(2);

        // Orden numérico de verdad: 2 < 12 < 100, no alfabético («100» < «12» < «2»).
        const ascendente = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?sort=${colCantidad}&order=asc`),
        );
        expect(ascendente.items.map((one) => one.data[colCantidad])).toEqual([2, 12, 100]);

        const buscada = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?search=berta`),
        );
        expect(buscada.items).toHaveLength(1);
        expect(buscada.items[0]?.data[colNombre]).toBe('Berta');
      });

      it('filtra por selección única y rechaza un operador que no le corresponde (D30)', async () => {
        const filtros = encodeURIComponent(
          JSON.stringify([{ columnKey: colEstado, operator: 'in', value: ['al-dia'] }]),
        );
        const filtradas = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?filters=${filtros}`),
        );
        expect(filtradas.items).toHaveLength(2);

        const malos = encodeURIComponent(
          JSON.stringify([{ columnKey: colEstado, operator: 'between', value: {} }]),
        );
        await get(`/api/v1/tables/${tableId}/rows?filters=${malos}`).expect(400);
      });

      it('filtra una casilla por «no», incluidas las filas que nunca la tocaron', async () => {
        // Berta y Carlos no llevan `colAsistio` en su `data` — nunca se marcó
        // la casilla al crearlos — y «No» tiene que encontrarlos igual que a
        // una fila que sí guarda `false` explícito (Regla 4 §5: regresión).
        const filtros = encodeURIComponent(
          JSON.stringify([{ columnKey: colAsistio, operator: 'equals', value: false }]),
        );
        const filtradas = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?filters=${filtros}`),
        );
        expect(filtradas.items.map((one) => one.data[colNombre]).sort()).toEqual([
          'Berta',
          'Carlos',
        ]);

        const conAsistio = encodeURIComponent(
          JSON.stringify([{ columnKey: colAsistio, operator: 'equals', value: true }]),
        );
        const asistieron = body<Paginated<CustomTableRow>>(
          await get(`/api/v1/tables/${tableId}/rows?filters=${conAsistio}`),
        );
        expect(asistieron.items.map((one) => one.data[colNombre])).toEqual(['Ana María']);
      });

      it('la contraseña no se puede filtrar (D29)', async () => {
        const filtros = encodeURIComponent(
          JSON.stringify([{ columnKey: colClave, operator: 'contains', value: 'x' }]),
        );
        await get(`/api/v1/tables/${tableId}/rows?filters=${filtros}`).expect(400);
      });

      it('cambiar el tipo de una columna no borra el dato: lo marca si ya no encaja (D9)', async () => {
        await patch(`/api/v1/tables/${tableId}/columns/${colNombreId}`, { type: 'number' }).expect(
          200,
        );

        const pagina = body<Paginated<CustomTableRow>>(await get(`/api/v1/tables/${tableId}/rows`));
        const encontrada = pagina.items.find((one) => one.id === rowId);
        expect(encontrada?.mismatches).toContain(colNombre);
        expect(encontrada?.data[colNombre]).toBe('Ana María');

        // Se deja como estaba, para no dejar el resto de la suite con un tipo cambiado.
        await patch(`/api/v1/tables/${tableId}/columns/${colNombreId}`, { type: 'text' }).expect(
          200,
        );
      });

      it('borrar una columna la oculta sin perder el dato de las filas (D10)', async () => {
        await del(`/api/v1/tables/${tableId}/columns/${colAsistioId}`).expect(200);

        const ficha = body<CustomTableWithColumns>(await get(`/api/v1/tables/${tableId}`));
        expect(ficha.columns.some((one) => one.key === colAsistio)).toBe(false);
      });

      it('borra una fila (borrado lógico)', async () => {
        await del(`/api/v1/tables/${tableId}/rows/${rowId}`).expect(200);
        const pagina = body<Paginated<CustomTableRow>>(await get(`/api/v1/tables/${tableId}/rows`));
        expect(pagina.items.some((one) => one.id === rowId)).toBe(false);
      });
    });

    describe('exportar', () => {
      it('excluye la contraseña por defecto y la incluye en claro si se pide (D23)', async () => {
        // La fila de «las filas» ya se borró a estas alturas: se crea una propia.
        await post(`/api/v1/tables/${tableId}/rows`, {
          data: { [colNombre]: 'Diana', [colClave]: 'portal-2026' },
        }).expect(201);

        const sinClave = body<ExportResponse<RowData>>(
          await get(`/api/v1/tables/${tableId}/export`),
        );
        expect(sinClave.rows.every((row) => !(colClave in row))).toBe(true);

        const conClave = body<ExportResponse<RowData>>(
          await get(`/api/v1/tables/${tableId}/export?includePasswords=true`),
        );
        expect(conClave.rows.some((row) => row[colClave] === 'portal-2026')).toBe(true);
      });
    });

    describe('vistas', () => {
      it('el tablero exige una columna de selección única', async () => {
        await post(`/api/v1/tables/${tableId}/views`, {
          name: 'Por estado',
          type: 'kanban',
        }).expect(400);

        const vista = body<CustomTableView>(
          await post(`/api/v1/tables/${tableId}/views`, {
            name: 'Por estado',
            type: 'kanban',
            groupBy: colEstado,
          }),
        );
        expect(vista.groupBy).toBe(colEstado);
      });

      it('el calendario exige una columna de fecha', async () => {
        await post(`/api/v1/tables/${tableId}/views`, {
          name: 'Este mes',
          type: 'calendar',
        }).expect(400);

        const vista = body<CustomTableView>(
          await post(`/api/v1/tables/${tableId}/views`, {
            name: 'Este mes',
            type: 'calendar',
            dateColumn: colFecha,
          }),
        );
        expect(vista.dateColumn).toBe(colFecha);
      });

      it('lista las vistas guardadas', async () => {
        const vistas = body<CustomTableView[]>(await get(`/api/v1/tables/${tableId}/views`));
        expect(vistas).toHaveLength(2);
      });
    });

    it('apagar la tabla la borra lógicamente sin más', async () => {
      await del(`/api/v1/tables/${tableId}`).expect(200);
      await get(`/api/v1/tables/${tableId}`).expect(404);
    });
  });
});
