const assert = require('node:assert/strict');
const base = process.env.SMOKE_API_URL || 'http://localhost:4000/api/v1';
(async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@pulsehr.dev', password: 'Password@123' }) });
  const loginBody = await login.json(); assert.equal(login.status, 200);
  const headers = { Authorization: `Bearer ${loginBody.data.accessToken}`, 'Content-Type': 'application/json' };
  const month = new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2;
  const year = new Date().getFullYear() + (month === 1 ? 1 : 0);
  const create = await fetch(`${base}/hr/payroll/runs`, { method: 'POST', headers, body: JSON.stringify({ month, year }) });
  const createdBody = await create.json(); assert.equal(create.status, 201, JSON.stringify(createdBody));
  const process = await fetch(`${base}/hr/payroll/runs/${createdBody.data.id}/process`, { method: 'POST', headers });
  const processedBody = await process.json(); assert.equal(process.status, 200, JSON.stringify(processedBody));
  assert.ok(processedBody.data.totalGross > 0); assert.ok(processedBody.data.totalNet > 0); assert.ok(processedBody.data.employeeCount > 0);
  console.log(`Payroll database smoke passed: ${processedBody.data.employeeCount} employees, gross ${processedBody.data.totalGross}, net ${processedBody.data.totalNet}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
