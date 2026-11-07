import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const roomPhotoDirectory = process.env.ROOM_PHOTO_DIRECTORY
  ? path.resolve(process.env.ROOM_PHOTO_DIRECTORY)
  : path.resolve(__dirname, '../../uploads/rooms');
const filePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;

export function isRoomPhotoFilename(filename: string): boolean {
  return filePattern.test(filename);
}

export async function prepareRoomPhoto(buffer: Buffer): Promise<Buffer> {
  const options = { limitInputPixels: 25_000_000, failOn: 'warning' as const };
  const metadata = await sharp(buffer, options).metadata();
  if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) !== 1) {
    throw new Error('Only still JPG, PNG and WebP photos are supported.');
  }
  return sharp(buffer, options).rotate().resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
}

export async function storeRoomPhoto(buffer: Buffer): Promise<string> {
  const filename = randomUUID() + '.webp';
  await mkdir(roomPhotoDirectory, { recursive: true });
  await writeFile(path.join(roomPhotoDirectory, filename), buffer, { flag: 'wx' });
  return '/api/media/' + filename;
}

export async function removeRoomPhoto(url: string): Promise<void> {
  if (!url.startsWith('/api/media/')) return;
  const filename = url.slice('/api/media/'.length);
  if (!isRoomPhotoFilename(filename)) return;
  try { await unlink(path.join(roomPhotoDirectory, filename)); }
  catch (error: unknown) {
    if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')) {
      console.error('Unable to remove an unused room photo.');
    }
  }
}
