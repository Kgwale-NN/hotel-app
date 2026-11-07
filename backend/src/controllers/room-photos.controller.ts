import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import pool from '../config/db';
import { prepareRoomPhoto, storeRoomPhoto, removeRoomPhoto } from '../services/room-photo.service';

const validId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const validAlt = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 250;

async function makeCover(client: PoolClient, accommodationId: string, imageId: string) {
  await client.query(
    `WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id)::integer AS position
      FROM accommodation_images WHERE accommodation_id = $1 AND id <> $2
    ) UPDATE accommodation_images AS image SET sort_order = ranked.position
      FROM ranked WHERE image.id = ranked.id`, [accommodationId, imageId]);
  await client.query('UPDATE accommodation_images SET sort_order = 0 WHERE id = $1', [imageId]);
}

async function rollback(client: PoolClient | undefined) {
  if (!client) return;
  try { await client.query('ROLLBACK'); } catch { /* A broken connection is discarded by the pool. */ }
}

export async function uploadRoomPhoto(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const body = req.body as Record<string, unknown> | undefined;
  if (!validId(id) || !body || Object.keys(body).some(key => !['alt_text', 'make_cover', 'replace_image_id'].includes(key)) || !validAlt(body.alt_text) ||
      (body.make_cover !== undefined && body.make_cover !== 'true' && body.make_cover !== 'false') ||
      (body.replace_image_id !== undefined && !validId(body.replace_image_id))) {
    res.status(400).json({ message: 'Provide a valid accommodation, photo description and optional replacement photo.' }); return;
  }
  if (!req.file) { res.status(400).json({ message: 'Choose a JPG, PNG or WebP photo up to 5 MB.' }); return; }
  let buffer: Buffer;
  try { buffer = await prepareRoomPhoto(req.file.buffer); }
  catch { res.status(400).json({ message: 'This photo could not be read. Choose a still JPG, PNG or WebP image up to 25 megapixels.' }); return; }
  let client: PoolClient | undefined;
  let newUrl: string | undefined;
  let committed = false;
  let committing = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const accommodation = await client.query('SELECT id FROM accommodations WHERE id = $1 FOR UPDATE', [id]);
    if (!accommodation.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ message: 'Accommodation not found.' }); return; }
    let previous: { id: string; image_url: string; sort_order: number } | undefined;
    if (body.replace_image_id) {
      const result = await client.query('SELECT id, image_url, sort_order FROM accommodation_images WHERE id = $1 AND accommodation_id = $2 FOR UPDATE', [body.replace_image_id, id]);
      previous = result.rows[0];
      if (!previous) { await client.query('ROLLBACK'); res.status(404).json({ message: 'The photo to replace was not found.' }); return; }
    }
    newUrl = await storeRoomPhoto(buffer);
    const result = previous
      ? await client.query('UPDATE accommodation_images SET image_url = $1, alt_text = $2 WHERE id = $3 RETURNING *', [newUrl, body.alt_text.trim(), previous.id])
      : await client.query(
        `INSERT INTO accommodation_images (accommodation_id, image_url, alt_text, sort_order)
         VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM accommodation_images WHERE accommodation_id = $1), 0)) RETURNING *`,
        [id, newUrl, body.alt_text.trim()]);
    if (body.make_cover === 'true') {
      await makeCover(client, id, result.rows[0].id);
      result.rows[0].sort_order = 0;
    }
    committing = true;
    await client.query('COMMIT'); committed = true;
    if (previous) await removeRoomPhoto(previous.image_url);
    res.status(previous ? 200 : 201).json({ data: result.rows[0], message: previous ? 'Photo replaced.' : 'Photo uploaded.' });
  } catch {
    await rollback(client);
    console.error('Unable to save room photo.');
    res.status(500).json({ message: 'Unable to save this photo. Please try again.' });
  } finally {
    // Keep the new file when a failed COMMIT has an uncertain outcome.
    if (newUrl && !committed && !committing) await removeRoomPhoto(newUrl);
    client?.release();
  }
}

export async function updateRoomPhoto(req: Request, res: Response): Promise<void> {
  const imageId = req.params.imageId;
  const body = req.body as Record<string, unknown> | undefined;
  if (!validId(imageId) || !body || !Object.keys(body).length || Object.keys(body).some(key => !['alt_text', 'make_cover'].includes(key)) ||
      (body.alt_text !== undefined && !validAlt(body.alt_text)) || (body.make_cover !== undefined && body.make_cover !== true)) {
    res.status(400).json({ message: 'Provide a photo description or make_cover: true.' }); return;
  }
  let client: PoolClient | undefined;
  try {
    client = await pool.connect(); await client.query('BEGIN');
    const existing = await client.query('SELECT accommodation_id FROM accommodation_images WHERE id = $1', [imageId]);
    if (!existing.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ message: 'Photo not found.' }); return; }
    const accommodationId = existing.rows[0].accommodation_id;
    await client.query('SELECT id FROM accommodations WHERE id = $1 FOR UPDATE', [accommodationId]);
    const result = await client.query('UPDATE accommodation_images SET alt_text = COALESCE($2, alt_text) WHERE id = $1 RETURNING *', [imageId, typeof body.alt_text === 'string' ? body.alt_text.trim() : null]);
    if (!result.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ message: 'Photo not found.' }); return; }
    if (body.make_cover) { await makeCover(client, accommodationId, imageId); result.rows[0].sort_order = 0; }
    await client.query('COMMIT');
    res.json({ data: result.rows[0], message: 'Photo updated.' });
  } catch {
    await rollback(client);
    res.status(500).json({ message: 'Unable to update this photo.' });
  } finally { client?.release(); }
}

export async function deleteRoomPhoto(req: Request, res: Response): Promise<void> {
  const imageId = req.params.imageId;
  if (!validId(imageId)) { res.status(400).json({ message: 'A valid photo ID is required.' }); return; }
  let client: PoolClient | undefined;
  try {
    client = await pool.connect(); await client.query('BEGIN');
    const existing = await client.query('SELECT accommodation_id FROM accommodation_images WHERE id = $1', [imageId]);
    if (!existing.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ message: 'Photo not found.' }); return; }
    await client.query('SELECT id FROM accommodations WHERE id = $1 FOR UPDATE', [existing.rows[0].accommodation_id]);
    const result = await client.query('DELETE FROM accommodation_images WHERE id = $1 RETURNING image_url', [imageId]);
    if (!result.rows.length) { await client.query('ROLLBACK'); res.status(404).json({ message: 'Photo not found.' }); return; }
    await client.query('COMMIT');
    await removeRoomPhoto(result.rows[0].image_url);
    res.json({ message: 'Photo removed.' });
  } catch {
    await rollback(client);
    res.status(500).json({ message: 'Unable to remove this photo.' });
  } finally { client?.release(); }
}
