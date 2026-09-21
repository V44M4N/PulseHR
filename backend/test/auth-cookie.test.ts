import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
vi.mock('../src/config/env', () => ({ env: { NODE_ENV: 'test' } }));
vi.mock('../src/modules/auth/auth.service', () => ({ refresh: vi.fn(async () => ({ accessToken: 'access', refreshToken: 'rotated' })) }));
import { refresh } from '../src/modules/auth/auth.controller';
import * as service from '../src/modules/auth/auth.service';
import { RefreshSchema } from '../src/modules/auth/auth.schema';
import { validate } from '../src/middleware/validate';
import { errorHandler } from '../src/middleware/errorHandler';
const app = express();
app.use(express.json());
app.post('/refresh', validate(RefreshSchema), refresh);
app.use(errorHandler);

describe('browser refresh transport', () => {
  it('accepts an HttpOnly cookie with an empty JSON body and rotates it', async () => {
    const response = await request(app).post('/refresh').set('Cookie', 'unrelated=value; refreshToken=original').send({});
    expect(response.status).toBe(200);
    expect(service.refresh).toHaveBeenCalledWith({ refreshToken: 'original' });
    expect(response.headers['set-cookie'][0]).toContain('refreshToken=rotated');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Strict');
  });
  it('retains body token support for non-browser clients', async () => {
    const response = await request(app).post('/refresh').send({ refreshToken: 'body-token' });
    expect(response.status).toBe(200);
    expect(service.refresh).toHaveBeenCalledWith({ refreshToken: 'body-token' });
  });
  it('rejects requests with no token', async () => {
    expect((await request(app).post('/refresh').send({})).status).toBe(401);
  });
  it('rejects malformed body tokens', async () => {
    expect((await request(app).post('/refresh').send({ refreshToken: 123 })).status).toBe(400);
  });
});
