// Run only against the seeded disposable development database.
const assert = require('node:assert/strict');
const base = process.env.SMOKE_API_URL || 'http://localhost:4000/api/v1';
async function call(path, { token, cookie, body, method = 'GET' } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
(async () => {
  const invalid = await call('/auth/login', { method: 'POST', body: { email: 'emp1@pulsehr.dev', password: 'incorrect' } });
  assert.equal(invalid.status, 401);
  for (const [email, role] of [['emp1@pulsehr.dev', 'EMPLOYEE'], ['manager@pulsehr.dev', 'MANAGER'], ['hr@pulsehr.dev', 'HR'], ['admin@pulsehr.dev', 'ADMIN']]) {
    const login = await call('/auth/login', { method: 'POST', body: { email, password: 'Password@123' } });
    assert.equal(login.status, 200);
    assert.equal(login.data.data.user.role, role);
    const access = login.data.data.accessToken;
    const me = await call('/auth/me', { token: access });
    assert.equal(me.status, 200); assert.equal(me.data.data.role, role);
    const admin = await call('/admin/settings', { token: access });
    assert.equal(admin.status, role === 'ADMIN' ? 200 : 403);
    const rotated = await call('/auth/refresh', { method: 'POST', cookie: login.cookie, body: {} });
    assert.equal(rotated.status, 200); assert.notEqual(rotated.cookie, login.cookie);
    const replay = await call('/auth/refresh', { method: 'POST', cookie: login.cookie, body: {} });
    assert.equal(replay.status, 401);
    const logout = await call('/auth/logout', { method: 'POST', token: rotated.data.data.accessToken, body: {} });
    assert.equal(logout.status, 200);
    assert.equal((await call('/auth/me', { token: rotated.data.data.accessToken })).status, 401);
    assert.equal((await call('/auth/refresh', { method: 'POST', cookie: rotated.cookie, body: {} })).status, 401);
    console.log(`${role}: login, identity, authorization, rotation, replay rejection and logout passed`);
  }
  console.log('Authentication database smoke checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
