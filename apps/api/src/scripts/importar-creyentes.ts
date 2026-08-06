import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { toSearchName } from '@navis/shared';
import type { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { Believer } from '../believers/believer.entity';
import { BelieversService } from '../believers/believers.service';
import { GiftsService } from '../believers/gifts.service';
import { MinistriesService } from '../believers/ministries.service';
import { Church } from '../churches/church.entity';
import { readPeople, type SheetPerson } from './believers-sheet';
import { splitName } from './split-name';
import { readWorkbook } from './xlsx-read';

/**
 * Importa el listado de hermanos de un `.xlsx` a una iglesia (RFC 0012 §6).
 *
 *   node dist/scripts/importar-creyentes.js <fichero.xlsx> --iglesia <slug> [--seco]
 *
 * Levanta **la aplicación de verdad** y escribe a través de `BelieversService`,
 * no con SQL a mano: así el nombre de búsqueda, las tablas puente y la
 * validación son exactamente los mismos que cuando alguien da de alta a una
 * persona desde la pantalla. Un importador con su propio camino de escritura es
 * un segundo sitio donde se decide qué es un creyente válido, y se desincroniza.
 *
 * **Es idempotente**: casa por nombre normalizado dentro de esa iglesia y
 * actualiza a quien ya esté. Se puede correr dos veces sin duplicar a nadie.
 *
 * **No borra a nadie**: quien esté en la base y no en el fichero se queda como
 * está. Un listado es lo que alguien apuntó un día, no la verdad completa de la
 * iglesia.
 */
async function main(): Promise<void> {
  const [file, ...rest] = process.argv.slice(2);
  const slug = option(rest, '--iglesia');
  const seco = rest.includes('--seco');

  if (!file || !slug) {
    console.error('Uso: importar-creyentes <fichero.xlsx> --iglesia <slug> [--seco]');
    process.exit(1);
  }

  const { people, unmatched } = readPeople(readWorkbook(file));
  console.log(`${String(people.length)} personas en el fichero`);
  if (unmatched.length > 0) {
    console.warn(
      `sin teléfono en la otra hoja (${String(unmatched.length)}): ${unmatched.join(', ')}`,
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  try {
    const churches = app.get<Repository<Church>>(getRepositoryToken(Church));
    const church = await churches.findOne({ where: { slug } });
    if (!church) throw new Error(`No hay ninguna iglesia con el slug «${slug}»`);

    // `ensureFor` siembra el catálogo si la iglesia todavía no lo tiene, que es
    // lo que pasa en una recién creada: así el import no depende de que alguien
    // haya abierto antes la pantalla de dones.
    const gifts = await app.get(GiftsService).ensureFor(church.id);
    const ministries = await app.get(MinistriesService).ensureFor(church.id);
    const believers = app.get(BelieversService);
    const repository = app.get<Repository<Believer>>(getRepositoryToken(Believer));

    const giftId = new Map(gifts.map((one) => [one.name, one.id]));
    const known = new Set(ministries.map((one) => one.slug));
    const ignoradas = new Set<string>();
    let nuevos = 0;
    let actualizados = 0;
    let sinTeléfono = 0;

    for (const person of people) {
      if (!person.phone) sinTeléfono++;
      for (const labor of Object.keys(person.ministries)) {
        if (!known.has(labor)) ignoradas.add(labor);
      }
      if (seco) continue;

      const searchName = toSearchName(person.fullName);
      const already = await repository.findOne({ where: { churchId: church.id, searchName } });
      const input = toInput(person, giftId, known);

      if (already) {
        await believers.update(church.id, already.id, input);
        actualizados++;
      } else {
        await believers.create(church.id, input);
        nuevos++;
      }
    }

    console.log(
      seco
        ? `EN SECO, no se ha escrito nada · sin teléfono: ${String(sinTeléfono)}`
        : `nuevos: ${String(nuevos)} · actualizados: ${String(actualizados)} · sin teléfono: ${String(sinTeléfono)}`,
    );
    if (ignoradas.size > 0) {
      console.warn(`labores fuera del catálogo, ignoradas: ${[...ignoradas].join(', ')}`);
    }
  } finally {
    await app.close();
  }
}

/** El valor de `--opcion valor`, o `null` si no está. */
function option(args: readonly string[], name: string): string | null {
  const index = args.indexOf(name);

  return index >= 0 ? (args[index + 1] ?? null) : null;
}

/** La persona de la hoja, con la forma que pide `BelieversService`. */
function toInput(
  person: SheetPerson,
  giftId: ReadonlyMap<string, string>,
  known: ReadonlySet<string>,
) {
  const { firstName, lastName } = splitName(person.fullName);
  const labores = Object.keys(person.ministries).filter((slug) => known.has(slug));

  const giftIds: string[] = [];
  const giftDates: Record<string, string | null> = {};
  for (const [name, receivedAt] of Object.entries(person.giftDates)) {
    const id = giftId.get(name);
    if (!id) continue;
    giftIds.push(id);
    giftDates[id] = receivedAt;
  }

  return {
    firstName,
    lastName,
    // Sin teléfono no se manda el campo: mandar `undefined` deja el que hubiera,
    // y mandar `null` lo borraría (ver `BelieversService.update`).
    ...(person.phone ? { phone: person.phone } : {}),
    ministries: labores,
    ministryDates: Object.fromEntries(labores.map((slug) => [slug, person.ministries[slug]])),
    giftIds,
    giftDates,
    arrivedAt: person.arrivedAt,
    arrivalSite: person.arrivalSite,
    bibleReadings: person.bibleReadings,
    vivenciasReadings: person.vivenciasReadings,
    bibleInstituteTimes: person.bibleInstituteTimes,
  };
}

void main().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
