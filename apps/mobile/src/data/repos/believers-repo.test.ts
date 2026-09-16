// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { addDays, toSearchName } from '@navis/shared';
import { setDbForTests } from '@/data/db';
import { createChurch } from '@/data/repos/church-repo';
import {
  believersSummary,
  createBeliever,
  deleteBeliever,
  findBeliever,
  listBelievers,
  setCongregation,
  updateBeliever,
} from '@/data/repos/believers-repo';
import { createNote, deleteNote, listNotes, noteCounts } from '@/data/repos/notes-repo';
import {
  createCatalogEntry,
  listCongregations,
  listGifts,
  listMinistries,
  listTags,
  updateCatalogEntry,
} from '@/data/repos/catalog-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
  __esModule: true,
  openDatabaseAsync: jest.fn(),
}));

describe('los creyentes en local (RFC 0003)', () => {
  let db: Awaited<ReturnType<typeof setupLocalDb>>;
  let churchId: string;
  const ownerId = 'usuario-local';
  const today = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    const church = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });
    churchId = church.id;
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    db.memory.exec(
      'DELETE FROM believers; DELETE FROM believer_notes; DELETE FROM believer_gifts; DELETE FROM believer_ministries; DELETE FROM believer_tag_links; DELETE FROM believer_tags;',
    );
  });
  async function addBeliever(values: {
    firstName: string;
    lastName?: string;
    status?: string;
    createdDaysAgo?: number;
    alertAfterDays?: number | null;
  }): Promise<string> {
    const createdAt = new Date(
      Date.now() - (values.createdDaysAgo ?? 0) * 24 * 60 * 60 * 1000,
    ).toISOString();
    const id = await createBeliever(churchId, {
      firstName: values.firstName,
      lastName: values.lastName,
      status: values.status,
      alertAfterDays: values.alertAfterDays,
    });
    if (values.createdDaysAgo) {
      db.memory.prepare('UPDATE believers SET created_at = ? WHERE id = ?').run(createdAt, id);
    }
    return id;
  }

  it('la iglesia nueva nace con los catálogos de serie', async () => {
    const gifts = await listGifts(churchId);
    const ministries = await listMinistries(churchId);
    expect(gifts).toHaveLength(7);
    expect(ministries.length).toBeGreaterThanOrEqual(10);
    expect(gifts[0]?.name).toBe('Profecía');
  });

  it('el listado busca sin acentos y pagina', async () => {
    await addBeliever({ firstName: 'Jesús', lastName: 'Ruiz' });
    await addBeliever({ firstName: 'María', lastName: 'Fernández' });

    const found = await listBelievers({ churchId, search: 'jesus' });
    expect(found.items).toHaveLength(1);
    expect(found.items[0]?.firstName).toBe('Jesús');
    expect(found.total).toBe(1);

    const all = await listBelievers({ churchId });
    expect(all.total).toBe(2);

    const page = await listBelievers({ churchId, limit: 1, page: 2, sort: 'name' });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);
  });

  it('los filtros se apilan: búsqueda, estado, sede, don, labor y etiqueta juntos', async () => {
    const congregations = await listCongregations(churchId);
    const sede = congregations[0];
    const gifts = await listGifts(churchId);
    const don = gifts[1];
    const labor = (await listMinistries(churchId)).find((one) => one.slug === 'pulpito');
    const etiqueta = (await listTags(churchId))[0];
    const vinculos = {
      congregationId: sede?.id ?? null,
      ministries: labor ? [labor.slug] : [],
      giftIds: don ? [don.id] : [],
      tagIds: etiqueta ? [etiqueta.id] : [],
    };

    // Ana reúne **todo**; Anabel corta por estado y Cara por sede, para que
    // ningún filtro del lote sobre otra persona pase sin decir nada.
    const ana = await addBeliever({ firstName: 'Ana', lastName: 'Vera', status: 'activo' });
    await updateBeliever(ana, churchId, vinculos);
    const anabel = await addBeliever({ firstName: 'Anabel', lastName: 'Rojas', status: 'nuevo' });
    await updateBeliever(anabel, churchId, vinculos);
    const cara = await addBeliever({ firstName: 'Cara', lastName: 'López', status: 'activo' });
    await updateBeliever(cara, churchId, {
      ministries: vinculos.ministries,
      giftIds: vinculos.giftIds,
      tagIds: vinculos.tagIds,
    });

    const found = await listBelievers({
      churchId,
      search: 'ana',
      status: ['activo'],
      congregationId: sede?.id,
      giftId: don?.id,
      ministry: labor?.slug,
      tagId: etiqueta?.id,
    });
    expect(found.items.map((one) => one.id)).toEqual([ana]);
    expect(found.items[0]?.ministries).toContain('pulpito');
  });

  it('los filtros se apilan también con el aviso de atención', async () => {
    const labor = (await listMinistries(churchId)).find((one) => one.slug === 'microfono');
    const id = await addBeliever({
      firstName: 'Elder',
      lastName: 'Mora',
      createdDaysAgo: 40,
      alertAfterDays: 10,
    });
    if (labor) await updateBeliever(id, churchId, { ministries: [labor.slug] });
    await createNote(id, churchId, ownerId, {
      kind: 'seguimiento',
      occurredAt: addDays(today, -20),
      told: 'Llamada que salió tarde',
    });

    // 20 días desde la última nota contra un margen de 10: el filtro de
    // atención lo encuentra solo a él, combinado con búsqueda y labor.
    const found = await listBelievers({
      churchId,
      search: 'elder',
      attention: true,
      ministry: 'microfono',
    });
    expect(found.items.map((one) => one.id)).toEqual([id]);
    expect(found.items[0]?.needsAttention).toBe(true);

    // Otra con la misma labor y sin margen agotado queda fuera del lote.
    const fresca = await addBeliever({
      firstName: 'Fresca',
      createdDaysAgo: 20,
      alertAfterDays: 30,
    });
    if (labor) await updateBeliever(fresca, churchId, { ministries: [labor.slug] });
    const solo = await listBelievers({ churchId, attention: true, ministry: 'microfono' });
    expect(solo.items.map((one) => one.id)).toEqual([id]);
  });

  it('el que agota su margen pide atención y el filtro lo encuentra', async () => {
    const id = await addBeliever({ firstName: 'Andrés', alertAfterDays: 10 });
    await createNote(id, churchId, ownerId, {
      kind: 'seguimiento',
      occurredAt: addDays(today, -20),
      told: 'Contó que estaba mejor',
    });

    const attention = await listBelievers({ churchId, attention: true });
    expect(attention.items.map((one) => one.id)).toContain(id);
    expect(attention.items[0]?.needsAttention).toBe(true);
    expect(attention.items[0]?.daysWithoutNote).toBe(20);

    const summary = await believersSummary(churchId);
    expect(summary.total).toBe(1);
    expect(summary.needsAttention).toBe(1);
  });

  it('sin notas el margen cuenta desde el alta y «sin notas» va primero', async () => {
    const withNote = await addBeliever({
      firstName: 'Con nota',
      createdDaysAgo: 40,
      alertAfterDays: 30,
    });
    await createNote(withNote, churchId, ownerId, {
      kind: 'seguimiento',
      occurredAt: addDays(today, -35),
      told: 'Primera visita',
    });
    await addBeliever({ firstName: 'Sin nota ninguna', createdDaysAgo: 5, alertAfterDays: 30 });

    const byLastNote = await listBelievers({ churchId, sort: 'lastNote' });
    expect(byLastNote.items[0]?.firstName).toBe('Sin nota ninguna');
    expect(byLastNote.items[0]?.daysWithoutNote).toBe(5);
  });

  it('la ficha trae dones, labores y etiquetas con sus fechas', async () => {
    const gifts = await listGifts(churchId);
    const gift = gifts[0];
    const id = await addBeliever({ firstName: 'Ana', lastName: 'García' });
    await updateBeliever(id, churchId, {
      ministries: ['pulpito', 'sonido'],
      giftIds: gift ? [gift.id] : [],
    });

    const detail = await findBeliever(id, churchId);
    expect(detail?.ministries).toEqual(['pulpito', 'sonido']);
    expect(detail?.gifts).toHaveLength(1);
    expect(detail?.ministryDates?.pulpito).toBeNull();
  });

  it('escribir una nota vacía la sonda y quitarla la vuelve a llenar (D4)', async () => {
    const id = await addBeliever({ firstName: 'Bruno', createdDaysAgo: 15, alertAfterDays: 30 });
    const noteId = await createNote(id, churchId, ownerId, {
      kind: 'testimonio',
      occurredAt: today,
      told: 'Contó su testimonio en la reunión',
    });

    const after = await findBeliever(id, churchId);
    expect(after?.lastNoteAt).toBe(today);
    expect(after?.daysWithoutNote).toBe(0);

    await deleteNote(noteId, id);
    const reverted = await findBeliever(id, churchId);
    expect(reverted?.lastNoteAt).toBeNull();
    expect(reverted?.daysWithoutNote).toBe(15);
  });

  it('una nota de don añade el don a la ficha (D8) y las cuentas cuadran', async () => {
    const gifts = await listGifts(churchId);
    const gift = gifts[1];
    const id = await addBeliever({ firstName: 'Carla' });
    await createNote(id, churchId, ownerId, {
      kind: 'don',
      occurredAt: today,
      told: 'Recibió el don en la reunión',
      giftId: gift?.id,
    });

    const detail = await findBeliever(id, churchId);
    expect(detail?.gifts).toHaveLength(1);
    expect(detail?.giftDates?.[gift?.id ?? '']).toBe(today);

    const counts = await noteCounts(id);
    expect(counts.don).toBe(1);
    expect(counts.total).toBe(1);

    const notes = await listNotes(id, churchId);
    expect(notes.items[0]?.giftName).toBe(gift?.name);
  });

  it('borrar a alguien borra también su bitácora', async () => {
    const id = await addBeliever({ firstName: 'Diana' });
    await createNote(id, churchId, ownerId, {
      kind: 'seguimiento',
      occurredAt: today,
      told: 'Llamada breve',
    });
    await deleteBeliever(id, churchId);

    expect(await findBeliever(id, churchId)).toBeNull();
    const notes = await listNotes(id, churchId);
    expect(notes.total).toBe(0);
  });

  it('la única acción en lote: poner sede', async () => {
    const one = await addBeliever({ firstName: 'Elena' });
    const two = await addBeliever({ firstName: 'Félix' });
    const congregations = await listCongregations(churchId);
    const sede = congregations[0];

    const updated = await setCongregation(churchId, [one, two], sede?.id ?? null);
    expect(updated).toBe(2);

    const list = await listBelievers({ churchId, congregationId: sede?.id });
    expect(list.total).toBe(2);
  });

  it('search_name se normaliza al renombrar', async () => {
    const id = await addBeliever({ firstName: 'José', lastName: 'Peña' });
    await updateBeliever(id, churchId, { firstName: 'María José', lastName: 'Ibarra' });

    const found = await listBelievers({ churchId, search: 'maria jose' });
    expect(found.items.map((one) => one.id)).toContain(id);
    expect(toSearchName('María José Ibarra')).toBe('maria jose ibarra');
  });

  it('el correo se guarda en minúsculas, como emailSchema', async () => {
    const id = await addBeliever({ firstName: 'Elena' });
    await updateBeliever(id, churchId, { email: 'Elena@Iglesia.ORG' });

    const detail = await findBeliever(id, churchId);
    expect(detail?.email).toBe('elena@iglesia.org');
  });

  it('el catálogo rechaza duplicados y renombrar no rompe el slug de la labor', async () => {
    await createCatalogEntry('gifts', churchId, { name: 'Palabra de conocimiento' });
    await expect(
      createCatalogEntry('gifts', churchId, { name: 'palabra de conocimiento' }),
    ).rejects.toThrow('duplicate');

    await createCatalogEntry('ministries', churchId, { name: 'Multimedia' });
    const ministries = await listMinistries(churchId);
    const created = ministries.find((one) => one.name === 'Multimedia');
    await updateCatalogEntry('ministries', created!.id, churchId, { name: 'Proyección' });

    const renamed = await listMinistries(churchId);
    const after = renamed.find((one) => one.id === created!.id);
    expect(after?.name).toBe('Proyección');
    expect(after?.slug).toBe(created!.slug);
  });

  it('las etiquetas se crean, se renombran y las de serie no se borran', async () => {
    await createCatalogEntry('tags', churchId, { name: 'En busca de trabajo' });
    let tags = await listTags(churchId);
    expect(tags).toHaveLength(1);
    const first = tags[0];

    await updateCatalogEntry('tags', first.id, churchId, { name: 'Buscando empleo' });
    tags = await listTags(churchId);
    expect(tags[0]?.name).toBe('Buscando empleo');
  });

  it('el destacado manda la lista: una etiqueta que no tiene se cae', async () => {
    await createCatalogEntry('tags', churchId, { name: 'Voluntario' });
    await createCatalogEntry('tags', churchId, { name: 'Nueva creencia' });
    const tags = await listTags(churchId);
    const [voluntario, nueva] = tags;
    const id = await addBeliever({ firstName: 'Marta' });

    await updateBeliever(id, churchId, { tagIds: [voluntario.id], featuredTagId: voluntario.id });
    let detail = await findBeliever(id, churchId);
    expect(detail?.featuredTagId).toBe(voluntario.id);

    // La destacada no está entre las etiquetas: se cae, no se aplica.
    await updateBeliever(id, churchId, { tagIds: [nueva.id], featuredTagId: voluntario.id });
    detail = await findBeliever(id, churchId);
    expect(detail?.featuredTagId).toBeNull();
  });

  it('las fechas de labores y dones viajan con su lista (RFC 0012)', async () => {
    const gifts = await listGifts(churchId);
    const gift = gifts[0];
    const id = await addBeliever({ firstName: 'Sergio' });

    await updateBeliever(id, churchId, {
      ministries: ['pulpito'],
      ministryDates: { pulpito: '2025-03-01' },
      giftIds: gift ? [gift.id] : [],
      giftDates: gift ? { [gift.id]: '2025-06-01' } : {},
    });

    const detail = await findBeliever(id, churchId);
    expect(detail?.ministryDates?.pulpito).toBe('2025-03-01');
    expect(detail?.giftDates?.[gift.id]).toBe('2025-06-01');
  });

  it('quitar una labor deja caer su fecha huérfana', async () => {
    const id = await addBeliever({ firstName: 'Laura' });
    await updateBeliever(id, churchId, {
      ministries: ['pulpito', 'sonido'],
      ministryDates: { pulpito: '2024-01-01' },
    });
    await updateBeliever(id, churchId, { ministries: ['sonido'] });

    const detail = await findBeliever(id, churchId);
    expect(detail?.ministries).toEqual(['sonido']);
    expect(detail?.ministryDates?.pulpito).toBeUndefined();
  });
});
