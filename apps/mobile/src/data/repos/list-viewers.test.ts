import { scryptSync } from 'node:crypto';
import { openDatabaseAsync } from 'expo-sqlite';
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '../db';
import { createChurch } from './church-repo';
import { createBeliever } from './believers-repo';
import { createList, readListMembers } from './lists-repo';
import { addListMembers } from './list-members-writes';
import { createListViewer, setViewerLists, revokeListViewer } from './list-viewers-writes';
import { updateListViewer, regenerateViewerPassword } from './list-viewers-settings';
import { readListViewers } from './list-viewers-reads';
import { newViewerPassword } from '@/lib/lists/viewer-password';
import { listPasswordSchema } from '@navis/shared';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));

describe('destinatarios y permisos en las tablas compartidas', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let context: { churchId: string; userId: string };
    let other: typeof context;
    let list: string;
    let second: string;
    let person: string;
    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        context = {
            churchId: (await createChurch({ name: 'Sur', city: 'Elda', ownerId: 'owner' })).id,
            userId: 'owner',
        };
        other = {
            churchId: (await createChurch({ name: 'Norte', city: 'Madrid', ownerId: 'other' })).id,
            userId: 'other',
        };
        list = await createList(context, { name: 'Sonido' });
        second = await createList(context, { name: 'Recepción' });
        person = await createBeliever(context.churchId, { firstName: 'Ana', lastName: 'Pérez' });
        await addListMembers(context, list, [person]);
    });
    afterAll(() => db.close());
    it('crear y regenerar conserva el formato scrypt verificable por el servidor, sin devolver el hash', async () => {
        const password = newViewerPassword();
        expect(listPasswordSchema.safeParse(password).success).toBe(true);
        const viewer = await createListViewer(context, {
            label: 'Ana Pérez',
            username: ' ANA.PEREZ ',
            password,
            believerId: person,
            listIds: [list, second],
        });
        expect(viewer.username).toBe('ana.perez');
        expect(viewer.listIds.sort()).toEqual([list, second].sort());
        expect(viewer).not.toHaveProperty('passwordHash');
        expect(viewer).not.toHaveProperty('password');
        const verify = async (raw: string) => {
            const row = await db.adapter.getFirstAsync<{ password_hash: string }>(
                'SELECT password_hash FROM list_viewers WHERE id = ?',
                viewer.id,
            );
            const [algorithm, n, r, p, salt, key] = row!.password_hash.split('$');
            expect(algorithm).toBe('scrypt');
            expect(
                scryptSync(raw.replace(/[\s-]+/g, ''), Buffer.from(salt, 'base64'), 32, {
                    N: Number(n),
                    r: Number(r),
                    p: Number(p),
                }).toString('base64'),
            ).toBe(key);
        };
        await verify(password);
        await regenerateViewerPassword(context, viewer.id, 'nueva-contraseña');
        await verify('nueva-contraseña');
        expect((await readListMembers(context, list))[0].hasAccess).toBe(true);
        await updateListViewer(context, viewer.id, { isActive: false });
        expect((await readListMembers(context, list))[0].hasAccess).toBe(false);
        await updateListViewer(context, viewer.id, {
            isActive: true,
            expiresAt: '2000-01-01T00:00:00.000Z',
        });
        expect((await readListMembers(context, list))[0].hasAccess).toBe(false);
        await revokeListViewer(context, viewer.id);
        expect(await readListViewers(context)).toEqual([]);
        expect(await readListMembers(context, list)).toHaveLength(1);
    });
    it('rechaza iglesia, persona, lista o usuario ajenos y revierte cambios de permisos', async () => {
        const foreignList = await createList(other, { name: 'Ajena' });
        const foreignPerson = await createBeliever(other.churchId, { firstName: 'Eva' });
        const input = {
            label: 'Equipo',
            username: 'equipo',
            password: 'abcd-efgh',
            listIds: [list],
        };
        await expect(
            createListViewer(context, { ...input, listIds: [list, foreignList] }),
        ).rejects.toThrow('not-found');
        await expect(
            createListViewer(context, { ...input, believerId: foreignPerson }),
        ).rejects.toThrow('not-found');
        expect(await readListViewers(context)).toEqual([]);
        const viewer = await createListViewer(context, input);
        await expect(createListViewer(context, input)).rejects.toThrow('username-taken');
        await expect(setViewerLists(context, viewer.id, [second, foreignList])).rejects.toThrow(
            'not-found',
        );
        expect((await readListViewers(context))[0].listIds).toEqual([list]);
        await expect(setViewerLists(other, viewer.id, [foreignList])).rejects.toThrow('not-found');
        await expect(revokeListViewer(other, viewer.id)).rejects.toThrow('not-found');
        expect(await readListViewers(other)).toEqual([]);
        await setViewerLists(context, viewer.id, [second]);
        expect((await readListViewers(context))[0].listIds).toEqual([second]);
        await db.adapter.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            'reader',
            context.churchId,
            'reader',
            't',
            't',
        );
        await expect(readListViewers({ ...context, userId: 'reader' })).rejects.toThrow(
            'not-found',
        );
        await expect(
            createListViewer({ ...context, userId: 'reader' }, { ...input, username: 'otro' }),
        ).rejects.toThrow('not-found');
    });
});
