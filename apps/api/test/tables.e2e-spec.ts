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
            await post('/api/v1/tables', { name: 'Asistencia a la lectura', icon: 'book' }).expect(
                400,
            );
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
                await post(`/api/v1/tables/${tableId}/columns`, {
                    label: 'Asistió',
                    type: 'checkbox',
                }),
            );
            colAsistio = asistio.key;
            colAsistioId = asistio.id;

            colFecha = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tableId}/columns`, { label: 'Fecha', type: 'date' }),
            ).key;
            colCantidad = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tableId}/columns`, {
                    label: 'Cantidad',
                    type: 'number',
                }),
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
                await patch(`/api/v1/tables/${tableId}/columns/${colNombreId}`, {
                    type: 'number',
                }).expect(200);

                const pagina = body<Paginated<CustomTableRow>>(
                    await get(`/api/v1/tables/${tableId}/rows`),
                );
                const encontrada = pagina.items.find((one) => one.id === rowId);
                expect(encontrada?.mismatches).toContain(colNombre);
                expect(encontrada?.data[colNombre]).toBe('Ana María');

                // Se deja como estaba, para no dejar el resto de la suite con un tipo cambiado.
                await patch(`/api/v1/tables/${tableId}/columns/${colNombreId}`, {
                    type: 'text',
                }).expect(200);
            });

            it('borrar una columna la oculta sin perder el dato de las filas (D10)', async () => {
                await del(`/api/v1/tables/${tableId}/columns/${colAsistioId}`).expect(200);

                const ficha = body<CustomTableWithColumns>(await get(`/api/v1/tables/${tableId}`));
                expect(ficha.columns.some((one) => one.key === colAsistio)).toBe(false);
            });

            it('borra una fila (borrado lógico)', async () => {
                await del(`/api/v1/tables/${tableId}/rows/${rowId}`).expect(200);
                const pagina = body<Paginated<CustomTableRow>>(
                    await get(`/api/v1/tables/${tableId}/rows`),
                );
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
                const vistas = body<CustomTableView[]>(
                    await get(`/api/v1/tables/${tableId}/views`),
                );
                expect(vistas).toHaveLength(2);
            });
        });

        it('apagar la tabla la borra lógicamente sin más', async () => {
            await del(`/api/v1/tables/${tableId}`).expect(200);
            await get(`/api/v1/tables/${tableId}`).expect(404);
        });

        /**
         * Regresión: el borrado es lógico y la fila se queda con `deleted_at`
         * puesto. El índice único de `slug` y de `name` no lo sabían, y crear
         * otra tabla con el mismo nombre —«Asistencia a la lectura», la que
         * acaba de borrarse arriba— chocaba con la borrada, con un 409 que no
         * decía por qué (D `PartialUniqueSlugs`).
         */
        it('crear otra tabla con el nombre de una borrada no choca con ella', async () => {
            const nueva = body<CustomTable>(
                await post('/api/v1/tables', {
                    name: 'Asistencia a la lectura',
                    icon: 'book',
                }).expect(201),
            );
            expect(nueva.slug).toBe('asistencia-a-la-lectura');
        });
    });

    /**
     * El enlace a creyentes (RFC 0025): una tabla cuyas filas salen del
     * listado y cuyas columnas se rellenan solas desde la ficha. Lo que no
     * puede probarse con dobles vive aquí: la subconsulta correlacionada del
     * orden y el filtro `EXISTS` (D12), el dato vivo tras cambiar la ficha
     * (D5), el valor escrito a mano que vuelve al desvincular (D6) y la fila
     * que sobrevive a la baja del creyente (D15).
     */
    describe('la tabla enlazada a creyentes', () => {
        let tablaId = '';
        let keyNombre = '';
        let keyTelefono = '';
        let keyExtra = '';

        const crearCreyente = async (datos: {
            firstName: string;
            lastName: string;
            phone?: string;
        }): Promise<string> => {
            const res = await post('/api/v1/believers', datos).expect(201);
            return body<{ id: string }>(res).id;
        };

        beforeAll(async () => {
            const tabla = body<CustomTable>(
                await post('/api/v1/tables', { name: 'Retiro de jóvenes', icon: 'users' }).expect(
                    201,
                ),
            );
            await patch(`/api/v1/tables/${tabla.id}`, { source: 'believers' }).expect(200);

            const ficha = body<CustomTableWithColumns>(
                await get(`/api/v1/tables/${tabla.id}`).expect(200),
            );
            tablaId = ficha.id;
            expect(ficha.source).toBe('believers');

            keyNombre = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tablaId}/columns`, {
                    label: 'Quién',
                    type: 'text',
                    believerField: 'fullName',
                }).expect(201),
            ).key;
            keyTelefono = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tablaId}/columns`, {
                    label: 'Móvil',
                    type: 'phone',
                    believerField: 'phone',
                }).expect(201),
            ).key;
            keyExtra = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tablaId}/columns`, {
                    label: 'Confirmó',
                    type: 'checkbox',
                }).expect(201),
            ).key;
        });

        it('vincular un par campo-tipo imposible se rechaza (D3, D4)', async () => {
            await post(`/api/v1/tables/${tablaId}/columns`, {
                label: 'Venció',
                type: 'date',
                believerField: 'phone',
            }).expect(400);
        });

        it('añade creyentes en lote, salta a los repetidos y exige los de la iglesia (D7, D9)', async () => {
            const juan = await crearCreyente({
                firstName: 'Juan Carlos',
                lastName: 'Ruiz',
                phone: '+57 300 111 1111',
            });
            const ana = await crearCreyente({ firstName: 'Ana', lastName: 'Molina' });

            const primera = body<{ added: number }>(
                await post(`/api/v1/tables/${tablaId}/believers`, {
                    believerIds: [juan, ana, juan],
                }).expect(201),
            );
            expect(primera.added).toBe(2);

            const repetido = body<{ added: number }>(
                await post(`/api/v1/tables/${tablaId}/believers`, {
                    believerIds: [juan],
                }).expect(201),
            );
            expect(repetido.added).toBe(0);

            await post(`/api/v1/tables/${tablaId}/believers`, {
                believerIds: ['00000000-0000-4000-8000-000000000000'],
            }).expect(400);
        });

        it('las columnas vinculadas llegan resueltas y una fila trae a su creyente (D11, D14)', async () => {
            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            expect(pagina.total).toBe(2);

            const fila = pagina.items[0];
            expect(typeof fila.data[keyNombre]).toBe('string');
            expect(fila.data[keyNombre]).toMatch(/Ruiz|Molina/);
            expect(fila.data[keyExtra]).toBeUndefined();
            expect(fila.believer).not.toBeNull();
            expect(fila.believer?.name.length ?? 0).toBeGreaterThan(0);
        });

        it('buscar encuentra a alguien por un dato que solo vive en su ficha (D12)', async () => {
            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows?search=Molina`).expect(200),
            );
            expect(pagina.total).toBe(1);
            expect(pagina.items[0].believer?.name).toContain('Molina');
        });

        it('el dato es vivo: cambiar la ficha cambia la tabla (D5)', async () => {
            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            const creyente = pagina.items.find((one) => one.believer !== null)?.believer;
            expect(creyente).toBeTruthy();
            if (!creyente) return;

            await patch(`/api/v1/believers/${creyente.id}`, { phone: '+57 300 999 9999' }).expect(
                200,
            );

            const otra = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            const fila = otra.items.find((one) => one.believer?.id === creyente.id);
            expect(fila?.data[keyTelefono]).toBe('+57 300 999 9999');
        });

        it('escribir en una celda vinculada se rechaza (D13)', async () => {
            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            const fila = pagina.items[0];

            await patch(`/api/v1/tables/${tablaId}/rows/${fila.id}`, {
                data: { [keyTelefono]: 'a mano' },
            }).expect(400);

            await post(`/api/v1/tables/${tablaId}/rows`, { data: {} }).expect(400);

            await post(`/api/v1/tables/${tablaId}/rows`, {
                data: {},
                believerId: fila.believer?.id,
            }).expect(400);
        });

        it('ordenar y filtrar por una columna vinculada resuelve contra believers (D12)', async () => {
            const ordenada = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows?sort=${keyTelefono}&order=asc`).expect(
                    200,
                ),
            );
            const telefonos = ordenada.items.map((one) => one.data[keyTelefono]);
            const conDatos = telefonos.filter((one) => typeof one === 'string');
            expect(conDatos.length).toBeGreaterThan(0);
            expect([...conDatos].sort()).toEqual(conDatos);

            const filtrada = body<Paginated<CustomTableRow>>(
                await get(
                    `/api/v1/tables/${tablaId}/rows?filters=${encodeURIComponent(
                        JSON.stringify([
                            { columnKey: keyNombre, operator: 'contains', value: 'Ana' },
                        ]),
                    )}`,
                ).expect(200),
            );
            expect(filtrada.total).toBe(1);

            const buscada = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows?search=Molina`).expect(200),
            );
            expect(buscada.total).toBe(1);
        });

        it('desvincular una columna devuelve el valor escrito a mano (D6)', async () => {
            const ficha = body<CustomTableWithColumns>(
                await get(`/api/v1/tables/${tablaId}`).expect(200),
            );
            const movil = ficha.columns.find((one) => one.key === keyTelefono);
            if (!movil) return;

            await patch(`/api/v1/tables/${tablaId}/columns/${movil.id}`, {
                believerField: null,
            }).expect(200);

            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            expect(pagina.items.every((one) => !(keyTelefono in one.data))).toBe(true);

            await patch(`/api/v1/tables/${tablaId}/columns/${movil.id}`, {
                believerField: 'phone',
            }).expect(200);

            const resuelta = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            expect(resuelta.items.some((one) => typeof one.data[keyTelefono] === 'string')).toBe(
                true,
            );
        });

        it('la fila sobrevive a la baja del creyente, marcada (D15)', async () => {
            const pagina = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            const deAna = pagina.items.find((one) => one.believer?.name.includes('Ana'));
            expect(deAna?.believer).toBeTruthy();
            if (!deAna?.believer) return;

            await del(`/api/v1/believers/${deAna.believer.id}`).expect(200);

            const despues = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            const fila = despues.items.find((one) => one.id === deAna.id);
            expect(fila).toBeDefined();
            expect(fila?.believer).toBeNull();
            // Su celda vinculada queda vacía: no enseña un dato que ya no es de nadie.
            expect(fila?.data[keyNombre]).toBeNull();
        });

        // Regresión: una fila hecha a mano antes de enlazar seguía enseñando en la
        // columna vinculada lo que se había escrito a mano (D7). El valor no se
        // borra —vuelve al desvincular (D6)—, solo deja de verse.
        it('una fila anterior al enlace ve vacía la celda vinculada, y el dato vuelve al desvincular (D6, D7)', async () => {
            const tabla = body<CustomTable>(
                await post('/api/v1/tables', { name: 'Hecha a mano', icon: 'users' }).expect(201),
            );
            const columna = body<CustomTableColumn>(
                await post(`/api/v1/tables/${tabla.id}/columns`, {
                    label: 'Quién',
                    type: 'text',
                }).expect(201),
            );
            await post(`/api/v1/tables/${tabla.id}/rows`, {
                data: { [columna.key]: 'escrito a mano' },
            }).expect(201);

            await patch(`/api/v1/tables/${tabla.id}`, { source: 'believers' }).expect(200);
            await patch(`/api/v1/tables/${tabla.id}/columns/${columna.id}`, {
                believerField: 'fullName',
            }).expect(200);

            const vinculada = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tabla.id}/rows`).expect(200),
            );
            expect(vinculada.items[0].data[columna.key]).toBeNull();

            await patch(`/api/v1/tables/${tabla.id}/columns/${columna.id}`, {
                believerField: null,
            }).expect(200);

            const manual = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tabla.id}/rows`).expect(200),
            );
            expect(manual.items[0].data[columna.key]).toBe('escrito a mano');
        });

        it('exportar trae las columnas vinculadas resueltas (D11)', async () => {
            const salida = body<ExportResponse<RowData>>(
                await get(`/api/v1/tables/${tablaId}/export`).expect(200),
            );
            expect(salida.rows.some((row) => typeof row[keyNombre] === 'string')).toBe(true);
        });

        it('desvincular la tabla entera es reversible y no toca filas (D1)', async () => {
            const antes = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );

            await patch(`/api/v1/tables/${tablaId}`, { source: null }).expect(200);
            const desconectada = body<CustomTable>(
                await get(`/api/v1/tables/${tablaId}`).expect(200),
            );
            expect(desconectada.source).toBeNull();

            const despues = body<Paginated<CustomTableRow>>(
                await get(`/api/v1/tables/${tablaId}/rows`).expect(200),
            );
            expect(despues.total).toBe(antes.total);

            await patch(`/api/v1/tables/${tablaId}`, { source: 'believers' }).expect(200);
        });
    });
});
