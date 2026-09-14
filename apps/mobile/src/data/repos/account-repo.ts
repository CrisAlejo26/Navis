import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { getDb, newId, nowIso } from '../db';

/**
 * La cuenta **local** (RFC 0024, Fase 1): sin Better Auth, porque no hay
 * servidor que emita la sesión. La contraseña se guarda hasheada — pepper de
 * 32 bytes por dispositivo (SecureStore) + email de sal — y el hash nunca
 * sale del teléfono.
 */

const PEPPER_KEY = 'navis.local.pepper';
const HASH_DOMAIN = 'navis-local-v1';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

function toUser(row: LocalUserRow): LocalUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function pepper(): Promise<string> {
  const stored = await SecureStore.getItemAsync(PEPPER_KEY);
  if (stored) return stored;

  const bytes = await getRandomBytesAsync(32);
  const fresh = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(PEPPER_KEY, fresh);
  return fresh;
}

async function hashPassword(email: string, password: string): Promise<string> {
  const salt = await pepper();
  const material = `${HASH_DOMAIN}:${salt}:${email.toLowerCase()}:${password}`;
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, material);
}

export type CreateAccountError = 'email-taken';

export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: LocalUser } | { error: CreateAccountError }> {
  const db = await getDb();
  const email = input.email.toLowerCase();

  const taken = await db.getFirstAsync<LocalUserRow>(
    'SELECT * FROM local_user WHERE email = ?',
    email,
  );
  if (taken) return { error: 'email-taken' };

  const user: LocalUser = {
    id: newId(),
    name: input.name,
    email,
    passwordHash: await hashPassword(email, input.password),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await db.runAsync(
    'INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    user.id,
    user.name,
    user.email,
    user.passwordHash,
    user.createdAt,
    user.updatedAt,
  );

  return { user };
}

export type LoginError = 'no-account' | 'wrong-password';

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: LocalUser } | { error: LoginError }> {
  const db = await getDb();
  const email = input.email.toLowerCase();

  const row = await db.getFirstAsync<LocalUserRow>(
    'SELECT * FROM local_user WHERE email = ?',
    email,
  );
  if (!row) return { error: 'no-account' };

  const candidate = await hashPassword(email, input.password);
  if (candidate !== row.password_hash) return { error: 'wrong-password' };

  return { user: toUser(row) };
}

export async function findUser(id: string): Promise<LocalUser | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalUserRow>('SELECT * FROM local_user WHERE id = ?', id);
  return row ? toUser(row) : null;
}

/** Cuántas cuentas hay: decide si la bienvenida ofrece «crear» o solo «entrar». */
export async function countAccounts(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM local_user');
  return row?.total ?? 0;
}
