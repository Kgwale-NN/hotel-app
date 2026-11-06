import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// OWASP scrypt option: 32 MiB, three passes. Store parameters for future upgrades.
const N = 32768, r = 8, p = 3;
const prefix = `scrypt$${N}$${r}$${p}$`;
export const dummyPasswordHash = `${prefix}${'0'.repeat(32)}$${'0'.repeat(128)}`;

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `${prefix}${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(prefix)) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const actual = await derive(password, parts[4]);
  return timingSafeEqual(actual, Buffer.from(parts[5], 'hex'));
}
