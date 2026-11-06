const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../dist/services/password.service');
const { registerWithPassword, loginWithPassword } = require('../dist/controllers/password-auth.controller');
const pool = require('../dist/config/db').default;
const password = 'A long hotel test passphrase!';
const user = { id: 'test-user', email: 'guest@example.test', full_name: 'Guest Test', role: 'guest', marketing_opt_in: false };
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
function request(body) {
  const req = { body, renewals: 0 };
  function session() { return { csrfToken: 'old-token', cookie: { expires: new Date() }, regenerate(done) { req.renewals++; req.session = session(); delete req.session.csrfToken; done(); }, save(done) { done(); } }; }
  req.session = session(); return req;
}
// All database calls below are mocked: real accounts are never created or changed.
test('password hashes use distinct salts and reject wrong or malformed credentials', async () => {
  const first = await hashPassword(password), second = await hashPassword(password);
  assert.notEqual(first, second); assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password + 'wrong', first), false);
  assert.equal(await verifyPassword(password, 'invalid'), false);
});
test('registration rejects short passwords and client-supplied admin roles', async () => {
  for (const body of [ { full_name: 'Guest', email: user.email, password: 'short' }, { full_name: 'Guest', email: user.email, password, role: 'admin' } ]) {
    const res = response(); await registerWithPassword(request(body), res); assert.equal(res.statusCode, 400);
  }
});
test('registration normalizes email, hashes password, and renews session', async () => {
  const original = pool.query; let values;
  pool.query = async (sql, input) => { assert.match(sql, /VALUES \(\$1, \$2, 'guest'\)/); values = input; return { rows: [user] }; };
  try {
    const req = request({ full_name: ' Guest Test ', email: ' GUEST@example.test ', password, remember_me: false }), res = response();
    await registerWithPassword(req, res);
    assert.equal(res.statusCode, 201); assert.equal(values[0], user.email); assert.equal(values[1], user.full_name);
    assert.equal(await verifyPassword(password, values[2]), true); assert.notEqual(values[2], password);
    assert.equal(req.session.userId, user.id); assert.equal(req.renewals, 1); assert.equal(req.session.csrfToken, undefined);
    assert.equal(req.session.cookie.expires, undefined); assert.equal(res.body.data.password_hash, undefined);
  } finally { pool.query = original; }
});
test('login verifies passwords, retains backend roles and supports remember me', async () => {
  const hash = await hashPassword(password), original = pool.query;
  pool.query = async () => ({ rows: [{ ...user, password_hash: hash }] });
  try {
    const req = request({ email: user.email, password, remember_me: true }), res = response();
    await loginWithPassword(req, res);
    assert.equal(res.statusCode, 200); assert.equal(res.body.data.role, 'guest'); assert.equal(res.body.data.password_hash, undefined);
    assert.equal(req.renewals, 1); assert.equal(req.session.cookie.maxAge, 30 * 24 * 60 * 60 * 1000);
    const badReq = request({ email: user.email, password: 'wrong password' }), badRes = response();
    await loginWithPassword(badReq, badRes); assert.equal(badRes.statusCode, 401); assert.equal(badReq.session.userId, undefined);
  } finally { pool.query = original; }
});
test('unknown accounts get a generic error and no session', async () => {
  const original = pool.query; pool.query = async () => ({ rows: [] });
  try {
    const req = request({ email: 'unknown@example.test', password }), res = response();
    await loginWithPassword(req, res); assert.equal(res.statusCode, 401); assert.match(res.body.message, /^Email or password is incorrect/); assert.equal(req.session.userId, undefined);
  } finally { pool.query = original; }
});
