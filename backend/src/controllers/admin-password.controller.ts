import type { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import pool from '../config/db';
import { hashPassword, verifyPassword } from '../services/password.service';

export async function setAdminPassword(req: Request, res: Response): Promise<void> {
  const user = res.locals.user;
  if (!user || user.role !== 'admin') { res.status(403).json({ message: 'Admin access is required.' }); return; }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['password', 'confirm_password', 'current_password'].includes(key)) ||
      typeof body.password !== 'string' || body.password.length < 15 || body.password.length > 128 ||
      body.password !== body.confirm_password ||
      (body.current_password !== undefined && typeof body.current_password !== 'string') ||
      (typeof body.current_password === 'string' && body.current_password.length > 128)) {
    res.status(400).json({ message: 'Enter matching app passwords of 15–128 characters.' }); return;
  }
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    // Lock the account so concurrent requests cannot both set its first password.
    const account = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'admin' FOR UPDATE", [user.id]);
    if (!account.rows.length) { await client.query('ROLLBACK'); res.status(403).json({ message: 'Admin access is required.' }); return; }
    const result = await client.query('SELECT password_hash FROM password_credentials WHERE user_id = $1', [user.id]);
    const stored = result.rows[0]?.password_hash;
    if (stored && !(await verifyPassword(body.current_password || '', stored))) {
      await client.query('ROLLBACK');
      res.status(403).json({ message: 'Enter your current hotel-app password to change it.' }); return;
    }
    const hash = await hashPassword(body.password);
    await client.query(
      'INSERT INTO password_credentials (user_id, password_hash) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()',
      [user.id, hash]
    );
    await client.query('COMMIT');
    res.json({ message: 'Your hotel-app password is ready. Use your account email and this password to sign in.' });
  } catch {
    if (client) { try { await client.query('ROLLBACK'); } catch { client.release(true); client = undefined; } }
    res.status(500).json({ message: 'Unable to save your app password. Please try again.' });
  } finally { client?.release(); }
}
