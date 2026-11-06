import '../types/session';
import { Request, Response } from 'express';
import pool from '../config/db';
import { dummyPasswordHash, hashPassword, verifyPassword } from '../services/password.service';

function parseCredentials(body: unknown, registering: boolean) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const allowed = registering ? ['full_name', 'email', 'password', 'remember_me'] : ['email', 'password', 'remember_me'];
  if (Object.keys(value).some(key => !allowed.includes(key))) return null;
  if (typeof value.email !== 'string' || value.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) return null;
  if (typeof value.password !== 'string' || value.password.length < (registering ? 15 : 1) || value.password.length > 128) return null;
  if (value.remember_me !== undefined && typeof value.remember_me !== 'boolean') return null;
  if (registering && (typeof value.full_name !== 'string' || !value.full_name.trim() || value.full_name.trim().length > 150)) return null;
  return { email: value.email.trim().toLowerCase(), password: value.password, fullName: registering ? (value.full_name as string).trim() : '', rememberMe: value.remember_me === true };
}

async function startSession(req: Request, userId: string, remember: boolean) {
  await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
  req.session.userId = userId;
  if (remember) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  else req.session.cookie.expires = undefined;
  await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
}

export async function registerWithPassword(req: Request, res: Response): Promise<void> {
  const input = parseCredentials(req.body, true);
  if (!input) {
    res.status(400).json({ message: 'Enter your name, a valid email and a password of 15–128 characters. Only account details are accepted.' });
    return;
  }
  if (req.session.userId) { res.status(409).json({ message: 'You are already signed in. Sign out to create another account.' }); return; }
  try {
    const passwordHash = await hashPassword(input.password);
    // The data-changing CTE keeps the user and password record in one atomic statement.
    const result = await pool.query(`
      WITH new_user AS (
        INSERT INTO users (email, full_name, role)
        VALUES ($1, $2, 'guest')
        RETURNING id, email, full_name, phone, avatar_url, role, marketing_opt_in
      ), credentials AS (
        INSERT INTO password_credentials (user_id, password_hash)
        SELECT id, $3 FROM new_user
        RETURNING user_id
      )
      SELECT new_user.* FROM new_user JOIN credentials ON credentials.user_id = new_user.id
    `, [input.email, input.fullName, passwordHash]);
    const user = result.rows[0];
    await startSession(req, user.id, input.rememberMe);
    res.status(201).json({ data: user, message: 'Your account is ready.' });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      res.status(409).json({ message: 'An account already uses this email. Sign in with your existing password or Google account.' });
      return;
    }
    console.error('Unable to register email account.');
    res.status(500).json({ message: 'Unable to create your account. Please try again.' });
  }
}

export async function loginWithPassword(req: Request, res: Response): Promise<void> {
  const input = parseCredentials(req.body, false);
  if (!input) { res.status(400).json({ message: 'Enter a valid email and password.' }); return; }
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role, u.marketing_opt_in, c.password_hash
      FROM users u JOIN password_credentials c ON c.user_id = u.id
      WHERE LOWER(u.email) = $1
    `, [input.email]);
    const record = result.rows[0];
    const valid = await verifyPassword(input.password, record?.password_hash || dummyPasswordHash);
    if (!record || !valid) { res.status(401).json({ message: 'Email or password is incorrect. If you registered with Google, continue with Google.' }); return; }
    await startSession(req, record.id, input.rememberMe);
    const { password_hash: _passwordHash, ...user } = record;
    res.json({ data: user, message: 'Welcome back.' });
  } catch {
    console.error('Unable to sign in with email.');
    res.status(500).json({ message: 'Unable to sign in. Please try again.' });
  }
}
