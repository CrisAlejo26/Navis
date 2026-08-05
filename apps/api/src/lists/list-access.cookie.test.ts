import { describe, expect, it } from 'vitest';

import { issueListCookie, listCookieFrom, readListCookie, LIST_COOKIE } from './list-access.cookie';

const VIEWER = '11111111-1111-4111-8111-111111111111';

describe('la cookie de un acceso', () => {
  it('devuelve el acceso que firmó', () => {
    expect(readListCookie(issueListCookie(VIEWER))?.viewerId).toBe(VIEWER);
  });

  it('no lleva dentro qué puede ver: solo quién, cuándo y hasta cuándo (D23)', () => {
    const [body] = issueListCookie(VIEWER).split('.');
    const payload: unknown = JSON.parse(Buffer.from(body ?? '', 'base64url').toString('utf8'));

    expect(Object.keys(payload as object).sort()).toEqual(['exp', 'iat', 'v']);
  });

  it('dice cuándo se emitió, que es lo que compara la revocación (D28)', () => {
    const cuando = new Date('2026-08-05T10:00:00Z');
    expect(readListCookie(issueListCookie(VIEWER, cuando), cuando)?.issuedAt).toEqual(cuando);
  });

  it('rechaza una cookie manipulada', () => {
    const cookie = issueListCookie(VIEWER);
    const [body, firma] = cookie.split('.');
    const otro = Buffer.from(JSON.stringify({ v: 'otro', exp: Date.now() + 1000 })).toString(
      'base64url',
    );

    expect(readListCookie(`${otro}.${firma ?? ''}`)).toBeNull();
    expect(readListCookie(`${body ?? ''}.aaaa`)).toBeNull();
  });

  it('rechaza una cookie caducada', () => {
    const cookie = issueListCookie(VIEWER, new Date(Date.now() - 13 * 3_600_000));
    expect(readListCookie(cookie)).toBeNull();
  });

  it('no se rompe con basura ni con la ausencia de cookie', () => {
    expect(readListCookie(undefined)).toBeNull();
    expect(readListCookie('')).toBeNull();
    expect(readListCookie('sin-punto')).toBeNull();
    expect(readListCookie('no-es-base64.tampoco')).toBeNull();
  });

  it('encuentra la suya entre las demás cookies del navegador', () => {
    const cookie = issueListCookie(VIEWER);
    const header = `otra=1; ${LIST_COOKIE}=${cookie}; better-auth.session_token=xyz`;

    expect(listCookieFrom(header)).toBe(cookie);
    expect(listCookieFrom('otra=1')).toBeUndefined();
    expect(listCookieFrom(undefined)).toBeUndefined();
  });
});
