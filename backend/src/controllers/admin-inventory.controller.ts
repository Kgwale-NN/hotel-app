import { Request, Response } from 'express';
import pool from '../config/db';

export async function getAdminHotels(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT id, name FROM hotels ORDER BY name, id');
    res.json({ data: result.rows });
  } catch {
    res.status(500).json({ message: 'Unable to load hotels.' });
  }
}

export async function getAdminAccommodationDetail(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(400).json({ message: 'A valid accommodation ID is required.' });
    return;
  }
  try {
    const result = await pool.query(`
      SELECT a.*, COALESCE((
        SELECT json_agg(json_build_object('id', r.id, 'room_number', r.room_number, 'is_active', r.is_active) ORDER BY r.room_number)
        FROM rooms r WHERE r.accommodation_id = a.id
      ), '[]'::json) AS rooms
      FROM accommodations a WHERE a.id = $1`, [id]);
    if (!result.rows.length) { res.status(404).json({ message: 'Accommodation not found.' }); return; }
    res.json({ data: result.rows[0] });
  } catch {
    res.status(500).json({ message: 'Unable to load accommodation details.' });
  }
}
