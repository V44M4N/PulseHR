const assert = require('node:assert/strict');
const base = process.env.SMOKE_API_URL || 'http://localhost:4000/api/v1';
(async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'emp2@pulsehr.dev', password: 'Password@123' }) });
  assert.equal(login.status, 200);
  const { data: { accessToken } } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  async function call(path, method = 'GET', body) {
    const result = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await result.json(); assert.ok(result.ok, JSON.stringify(json)); return json.data;
  }
  const balances = await call('/leave/balances');
  const balance = balances.find(item => item.total - item.used > 0 && item.leaveType.isActive);
  assert.ok(balance);
  const day = new Date(); while ([0, 6].includes(day.getDay())) day.setDate(day.getDate() + 1);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const created = await call('/leave/requests', 'POST', { leaveTypeId: balance.leaveType.id, fromDate: date, toDate: date, reason: 'Phase 2 database smoke test' });
  assert.equal(created.status, 'PENDING');
  assert.ok((await call('/leave/requests')).some(item => item.id === created.id));
  assert.equal((await call('/leave/balances')).find(item => item.id === balance.id).used, balance.used + 1);
  await call(`/leave/requests/${created.id}/cancel`, 'PUT', {});
  assert.equal((await call('/leave/requests')).find(item => item.id === created.id).status, 'CANCELLED');
  assert.equal((await call('/leave/balances')).find(item => item.id === balance.id).used, balance.used);
  console.log(`Database create/read/update passed: ${created.code}; cancellation restored the balance`);
  await call('/auth/logout', 'POST', {});
})().catch(error => { console.error(error); process.exitCode = 1; });
