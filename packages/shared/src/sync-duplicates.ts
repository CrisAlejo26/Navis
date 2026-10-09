/**
 * Detección de posibles duplicados de creyentes (Fase 6). Solo **sugiere**:
 * un nombre parecido no es la misma persona, y un teléfono o un correo
 * compartidos son evidencia, no certeza (las familias comparten). Nunca se
 * fusiona nada solo, y nunca entre iglesias distintas.
 */
export interface PersonCandidate {
    id: string;
    churchId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
}

export type Evidence = 'name' | 'phone' | 'email';

export interface DuplicatePair {
    a: string;
    b: string;
    evidence: Evidence[];
    /** `likely`: coincide el nombre y además un dato de contacto. El resto es `possible`. */
    confidence: 'likely' | 'possible';
}

const strip = (text: string): string =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const nameKey = (person: PersonCandidate): string =>
    strip(`${person.firstName} ${person.lastName}`);

/** Solo los dígitos, y solo si hay los bastantes para ser un teléfono (7). */
function phoneKey(phone: string | null): string | null {
    const digits = (phone ?? '').replace(/\D/g, '');
    return digits.length >= 7 ? digits.slice(-9) : null;
}

const emailKey = (email: string | null): string | null => {
    const key = strip(email ?? '');
    return key.includes('@') ? key : null;
};

export function findDuplicateCandidates(people: readonly PersonCandidate[]): DuplicatePair[] {
    const pairs: DuplicatePair[] = [];
    for (let i = 0; i < people.length; i += 1) {
        for (let j = i + 1; j < people.length; j += 1) {
            const [first, second] = [people[i], people[j]];
            if (!first || !second || first.churchId !== second.churchId) continue;

            const evidence: Evidence[] = [];
            const [nameA, nameB] = [nameKey(first), nameKey(second)];
            if (nameA !== '' && nameA === nameB) evidence.push('name');
            const [phoneA, phoneB] = [phoneKey(first.phone), phoneKey(second.phone)];
            if (phoneA && phoneA === phoneB) evidence.push('phone');
            const [emailA, emailB] = [emailKey(first.email), emailKey(second.email)];
            if (emailA && emailA === emailB) evidence.push('email');
            if (evidence.length === 0) continue;

            pairs.push({
                a: first.id,
                b: second.id,
                evidence,
                confidence:
                    evidence.includes('name') && evidence.length > 1 ? 'likely' : 'possible',
            });
        }
    }
    return pairs;
}
