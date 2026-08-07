import { describe, expect, it } from 'vitest';

import type { ListMember } from './list-members';
import { DEFAULT_PUBLIC_FIELDS, type ListPublicFields } from './lists';
import { toPublicListMember } from './public-lists';

const MIEMBRO: ListMember = {
  believerId: '11111111-1111-4111-8111-111111111111',
  firstName: 'Juan',
  lastName: 'Pérez',
  position: 0,
  note: 'Solo primer domingo',
  congregationId: '22222222-2222-4222-8222-222222222222',
  congregationName: 'Elda',
  congregationAccent: '#2140cf',
  ministries: ['pulpito', 'sonido'],
  hasPhoto: true,
  hasAccess: true,
  arrivedAt: '2020-01-01',
  arrivalSite: 'Elda',
  bibleReadings: 3,
  vivenciasReadings: 1,
  bibleInstituteTimes: 2,
};

const todo: ListPublicFields = {
  nameStyle: 'full',
  congregation: true,
  ministry: true,
  photo: true,
  note: true,
  arrival: true,
  bibleReadings: true,
  vivenciasReadings: true,
  bibleInstituteTimes: true,
};

describe('lo que sale a la calle', () => {
  it('por defecto solo saca el nombre y la posición (D16)', () => {
    expect(toPublicListMember(MIEMBRO, DEFAULT_PUBLIC_FIELDS)).toEqual({
      position: 0,
      name: 'Juan Pérez',
      note: null,
      congregation: null,
      ministry: null,
      photoId: null,
      arrivedAt: null,
      arrivalSite: null,
      bibleReadings: null,
      vivenciasReadings: null,
      bibleInstituteTimes: null,
    });
  });

  it('no saca teléfono, estado, dones, alertas ni la sede interna, ni activándolo todo', () => {
    const publico = toPublicListMember(MIEMBRO, todo);

    expect(Object.keys(publico).sort()).toEqual([
      'arrivalSite',
      'arrivedAt',
      'bibleInstituteTimes',
      'bibleReadings',
      'congregation',
      'ministry',
      'name',
      'note',
      'photoId',
      'position',
      'vivenciasReadings',
    ]);
    expect(JSON.stringify(publico)).not.toContain(MIEMBRO.congregationId);
    expect(JSON.stringify(publico)).not.toContain('hasAccess');
  });

  it('no dice nunca si esa persona tiene acceso, y a qué', () => {
    expect(JSON.stringify(toPublicListMember(MIEMBRO, todo))).not.toContain('true');
  });

  it('con la foto apagada no sale ni un identificador', () => {
    const publico = toPublicListMember(MIEMBRO, { ...todo, photo: false });

    expect(publico.photoId).toBeNull();
    expect(JSON.stringify(publico)).not.toContain(MIEMBRO.believerId);
  });

  it('con la foto encendida sale el identificador, que es lo que pide la imagen (D17)', () => {
    expect(toPublicListMember(MIEMBRO, todo).photoId).toBe(MIEMBRO.believerId);
  });

  it('no da identificador a quien no tiene foto, aunque estén encendidas', () => {
    expect(toPublicListMember({ ...MIEMBRO, hasPhoto: false }, todo).photoId).toBeNull();
  });

  it('acorta el apellido a su inicial cuando se pide así', () => {
    expect(toPublicListMember(MIEMBRO, { ...todo, nameStyle: 'initial' }).name).toBe('Juan P.');
  });

  it('no deja un punto suelto en quien no tiene apellido', () => {
    const sinApellido = { ...MIEMBRO, lastName: '' };

    expect(toPublicListMember(sinApellido, { ...todo, nameStyle: 'initial' }).name).toBe('Juan');
    expect(toPublicListMember(sinApellido, todo).name).toBe('Juan');
  });

  it('saca la primera labor y no todas: en un cartel una basta', () => {
    expect(toPublicListMember(MIEMBRO, todo).ministry).toBe('pulpito');
  });

  it('la trayectoria (RFC 0012) no sale hasta que se activa, campo a campo', () => {
    const soloLlegada = toPublicListMember(MIEMBRO, { ...DEFAULT_PUBLIC_FIELDS, arrival: true });

    expect(soloLlegada.arrivedAt).toBe('2020-01-01');
    expect(soloLlegada.arrivalSite).toBe('Elda');
    expect(soloLlegada.bibleReadings).toBeNull();
    expect(soloLlegada.vivenciasReadings).toBeNull();
    expect(soloLlegada.bibleInstituteTimes).toBeNull();

    const conLecturas = toPublicListMember(MIEMBRO, {
      ...DEFAULT_PUBLIC_FIELDS,
      bibleReadings: true,
      vivenciasReadings: true,
      bibleInstituteTimes: true,
    });

    expect(conLecturas.arrivedAt).toBeNull();
    expect(conLecturas.bibleReadings).toBe(3);
    expect(conLecturas.vivenciasReadings).toBe(1);
    expect(conLecturas.bibleInstituteTimes).toBe(2);
  });
});
