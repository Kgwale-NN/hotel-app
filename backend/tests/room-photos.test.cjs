const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const sharp = require('sharp');

// All database calls are mocked. Uploaded test files live only in an isolated temporary folder.
test('admin room photo upload, replacement and access controls', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'hotel-photo-test-'));
  process.env.ROOM_PHOTO_DIRECTORY = directory;
  const pool = require('../dist/config/db').default;
  const originalQuery = pool.query;
  const originalConnect = pool.connect;
  const service = require('../dist/services/room-photo.service');
  const adminRouter = require('../dist/routes/admin.routes').default;
  const mediaRouter = require('../dist/routes/media.routes').default;
  const accommodation = '20000000-0000-4000-8000-000000000001';
  const imageId = '30000000-0000-4000-8000-000000000001';
  let image;
  let queries = [];
  let failPhotoWrite = false;
  pool.query = async () => ({ rows: [{ id: 'test-user', role: currentRole }] });
  let currentRole = 'admin';
  pool.connect = async () => ({
    release() {},
    async query(sql, values = []) {
      queries.push({ sql, values });
      if (failPhotoWrite && sql.startsWith('UPDATE accommodation_images SET image_url')) throw new Error('Simulated write failure');
      if (sql.startsWith('SELECT id FROM accommodations')) return { rows: [{ id: accommodation }] };
      if (sql.startsWith('SELECT id, image_url')) return { rows: image && values[0] === image.id && values[1] === image.accommodation_id ? [image] : [] };
      if (sql.startsWith('INSERT INTO accommodation_images')) {
        image = { id: imageId, accommodation_id: values[0], image_url: values[1], alt_text: values[2], sort_order: 0 };
        return { rows: [{ ...image }] };
      }
      if (sql.startsWith('UPDATE accommodation_images SET image_url')) {
        image = { ...image, image_url: values[0], alt_text: values[1] };
        return { rows: [{ ...image }] };
      }
      if (sql.startsWith('SELECT accommodation_id')) return { rows: image ? [{ accommodation_id: accommodation }] : [] };
      if (sql.startsWith('UPDATE accommodation_images SET alt_text')) return { rows: image ? [{ ...image }] : [] };
      if (sql.startsWith('DELETE FROM accommodation_images')) { const old = image; image = undefined; return { rows: old ? [old] : [] } }
      return { rows: [] };
    },
  });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.session = { userId: req.get('x-test-guest') ? undefined : 'test-user', csrfToken: 'test-csrf' }; next() });
  app.use('/api/admin', adminRouter);
  app.use('/api/media', mediaRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const jpeg = await sharp({ create: { width: 24, height: 16, channels: 3, background: '#a67c52' } }).jpeg().toBuffer();
  const form = (buffer = jpeg, mime = 'image/jpeg', replacement) => {
    const body = new FormData();
    body.append('photo', new Blob([buffer], { type: mime }), 'room.jpg');
    body.append('alt_text', 'Updated suite');
    body.append('make_cover', 'true');
    if (replacement) body.append('replace_image_id', replacement);
    return body;
  };
  const upload = (body, headers = { 'X-CSRF-Token': 'test-csrf' }) => fetch(`${base}/api/admin/accommodations/${accommodation}/images/upload`, { method: 'POST', headers, body });
  try {
    await t.test('guests, regular users and missing CSRF cannot upload', async () => {
      assert.equal((await upload(form(), { 'x-test-guest': '1' })).status, 401);
      currentRole = 'user';
      assert.equal((await upload(form())).status, 403);
      currentRole = 'admin';
      assert.equal((await upload(form(), {})).status, 403);
      assert.deepEqual(await fs.readdir(directory), []);
    });
    await t.test('rejects oversized, unsupported and forged image files', async () => {
      assert.equal((await upload(form(Buffer.alloc(5 * 1024 * 1024 + 1)))).status, 413);
      assert.equal((await upload(form(Buffer.from('<svg/>'), 'image/svg+xml'))).status, 400);
      assert.equal((await upload(form(Buffer.from('not an image')))).status, 400);
      assert.deepEqual(await fs.readdir(directory), []);
    });
    await t.test('uploads a decoded WebP and serves it publicly', async () => {
      const response = await upload(form());
      assert.equal(response.status, 201, JSON.stringify(await response.clone().json()));
      const result = await response.json();
      assert.match(result.data.image_url, /^\/api\/media\/[a-f0-9-]+\.webp$/);
      assert.equal(result.data.alt_text, 'Updated suite');
      const media = await fetch(base + result.data.image_url);
      assert.equal(media.status, 200);
      assert.equal(media.headers.get('x-content-type-options'), 'nosniff');
      assert.equal((await sharp(Buffer.from(await media.arrayBuffer())).metadata()).format, 'webp');
      assert.ok(queries.some(q => q.sql.includes('SET sort_order = 0')));
    });
    await t.test('rejects replacing a photo outside the selected accommodation', async () => {
      const before = await fs.readdir(directory);
      assert.equal((await upload(form(jpeg, 'image/jpeg', '30000000-0000-4000-8000-000000000099'))).status, 404);
      assert.deepEqual(await fs.readdir(directory), before);
    });
    await t.test('replacement preserves photo ID and removes the old stored file', async () => {
      const oldUrl = image.image_url;
      const response = await upload(form(jpeg, 'image/jpeg', imageId));
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.data.id, imageId);
      assert.notEqual(result.data.image_url, oldUrl);
      assert.equal((await fetch(base + oldUrl)).status, 404);
      assert.equal((await fetch(base + result.data.image_url)).status, 200);
      assert.equal((await fs.readdir(directory)).length, 1);
    });
    await t.test('failed database writes clean up the new file and keep the existing photo', async () => {
      const before = await fs.readdir(directory);
      const oldUrl = image.image_url;
      failPhotoWrite = true;
      try { assert.equal((await upload(form(jpeg, 'image/jpeg', imageId))).status, 500) }
      finally { failPhotoWrite = false }
      assert.deepEqual(await fs.readdir(directory), before);
      assert.equal((await fetch(base + oldUrl)).status, 200);
    });
    await t.test('can select a main photo and delete an uploaded photo', async () => {
      const headers = { 'X-CSRF-Token': 'test-csrf', 'Content-Type': 'application/json' };
      assert.equal((await fetch(`${base}/api/admin/images/${imageId}`, { method: 'PATCH', headers, body: JSON.stringify({ make_cover: true }) })).status, 200);
      assert.equal((await fetch(`${base}/api/admin/images/${imageId}`, { method: 'DELETE', headers })).status, 200);
      assert.deepEqual(await fs.readdir(directory), []);
    });
    await t.test('only generated media filenames can be served or removed', async () => {
      assert.equal(service.isRoomPhotoFilename('../postgresql.conf'), false);
      assert.equal((await fetch(base + '/api/media/not-a-photo.webp')).status, 404);
      await service.removeRoomPhoto('/api/media/../../outside.jpg');
    });
    await t.test('large images are resized to the room gallery bounds', async () => {
      const large = await sharp({ create: { width: 2500, height: 1500, channels: 3, background: 'white' } }).png().toBuffer();
      const output = await sharp(await service.prepareRoomPhoto(large)).metadata();
      assert.equal(output.width, 1920);
      assert.ok(output.height <= 1440);
    });
  } finally {
    pool.query = originalQuery; pool.connect = originalConnect;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    for (const filename of await fs.readdir(directory)) {
      assert.ok(service.isRoomPhotoFilename(filename));
      await fs.unlink(path.join(directory, filename));
    }
    await fs.rmdir(directory);
  }
});
