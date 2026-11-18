const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../dist/config/db').default;
const { setAdminPassword } = require('../dist/controllers/admin-password.controller');
const { loginWithPassword } = require('../dist/controllers/password-auth.controller');
const { verifyPassword, hashPassword } = require('../dist/services/password.service');
const password = 'A different hotel app password!';
const response = (role = 'admin') => ({ locals: { user: { id: 'existing-admin', role } }, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('admin app password setup and email login use the existing account without Google', async t => {
  const originalConnect = pool.connect, originalQuery = pool.query;
  let stored, queries, allowed = true, fail = false;
  pool.connect = async () => ({ release() {}, async query(sql, values) {
    queries.push({ sql, values });
    if (sql.startsWith('SELECT id FROM users')) return { rows: allowed ? [{ id: 'existing-admin' }] : [] };
    if (sql.startsWith('SELECT password_hash')) return { rows: stored ? [{ password_hash: stored }] : [] };
    if (sql.startsWith('INSERT INTO password_credentials')) { if (fail) throw Error('Mock database failure'); stored = values[1]; }
    return { rows: [] };
  }});
  const input = extra => ({ body: { password, confirm_password: password, ...extra } });
  try {
    await t.test('rejects guests and invalid input before database writes', async () => {
      queries=[]; const guest=response('guest');await setAdminPassword(input(),guest);assert.equal(guest.statusCode,403);
      for (const extra of [{ confirm_password:'mismatch' }, { password:'short',confirm_password:'short' }, { user_id:'another-admin' }]) {
        const res=response();await setAdminPassword(input(extra),res);assert.equal(res.statusCode,400);
      }
      assert.equal(queries.length,0);
    });
    await t.test('sets a first password as a salted hash for the current admin only', async () => {
      queries=[];const res=response();await setAdminPassword(input(),res);assert.equal(res.statusCode,200);
      assert.ok(await verifyPassword(password,stored));assert.notEqual(stored,password);
      const write=queries.find(q=>q.sql.startsWith('INSERT INTO password_credentials'));assert.equal(write.values[0],'existing-admin');
      assert.ok(!JSON.stringify(res.body).includes(stored));assert.ok(!JSON.stringify(res.body).includes(password));
      assert.ok(queries.some(q=>q.sql==='COMMIT'));
    });
    await t.test('cannot replace an existing password without the current app password', async () => {
      const originalHash=stored;queries=[];const res=response();await setAdminPassword(input({current_password:'wrong'}),res);
      assert.equal(res.statusCode,403);assert.equal(stored,originalHash);assert.ok(queries.some(q=>q.sql==='ROLLBACK'));
      const good=response();await setAdminPassword(input({current_password:password}),good);assert.equal(good.statusCode,200);
    });
    await t.test('rechecks admin role under a row lock', async () => {
      allowed=false;queries=[];const res=response();await setAdminPassword(input(),res);assert.equal(res.statusCode,403);
      assert.ok(queries.some(q=>q.sql.includes('FOR UPDATE')));assert.ok(!queries.some(q=>q.sql.startsWith('INSERT')));allowed=true;
    });
    await t.test('database write failure rolls back', async () => {
      stored=undefined;fail=true;queries=[];const res=response();await setAdminPassword(input(),res);
      assert.equal(res.statusCode,500);assert.ok(queries.some(q=>q.sql==='ROLLBACK'));fail=false;
    });
    await t.test('email login preserves admin access and renews the session', async () => {
      stored=await hashPassword(password);
      pool.query=async()=>({rows:[{id:'existing-admin',email:'admin@example.test',role:'admin',password_hash:stored}]});
      const req={body:{email:'admin@example.test',password},session:{regenerate(cb){req.session={cookie:{},save(done){done()}};cb()}}};
      const res=response();await loginWithPassword(req,res);assert.equal(res.statusCode,200);
      assert.equal(res.body.data.role,'admin');assert.equal(req.session.userId,'existing-admin');assert.equal(res.body.data.password_hash,undefined);
    });
  } finally { pool.connect=originalConnect;pool.query=originalQuery; }
});
