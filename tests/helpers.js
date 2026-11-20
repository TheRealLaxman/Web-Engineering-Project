import request from 'supertest';
import { config } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';
import { bootstrapAdmin } from '../src/data/bootstrap-admin.js';

// ── Fast password fakes (scrypt is deliberately slow; tests must not be) ──
export const fakeHash = async (plain) => `fake-hash:${plain}`;
export const fakeVerify = async (plain, hash) => hash === `fake-hash:${plain}`;

// ── Fixtures ──
export const ADMIN = {
  firstName: 'Ada',
  lastName: 'Admin',
  email: 'admin@test.com',
  password: 'Admin123',
};

export const SITA = {
  firstName: 'Sita',
  lastName: 'Gurung',
  email: 'sita@test.com',
  password: 'Secret123',
  address: { street: 'Lakeside Road 5', city: 'Pokhara', country: 'Nepal' },
};

export const RAM = {
  firstName: 'Ram',
  lastName: 'Thapa',
  email: 'ram@test.com',
  password: 'Secret123',
};

// ── App builder: a fresh in-memory DB + fake hasher per test ──
export async function buildTestApp(overrides = {}) {
  const container = createContainer({ hashPassword: fakeHash, verifyPassword: fakeVerify, ...overrides });
  await bootstrapAdmin(container.usersService, { email: ADMIN.email, password: ADMIN.password });
  return { app: createApp(container), container };
}

// ── Register + login helpers (require admin for /register in 2.3) ──
export async function registerAs(app, person = SITA) {
  const admin = await loginAs(app, ADMIN.email, ADMIN.password);
  const res = await request(app)
    .post('/api/v1/auth/register')
    .set('Authorization', bearer(admin.accessToken))
    .send(person);
  if (res.status !== 201) throw new Error(`registerAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.user;
}

export async function loginAs(app, email, password) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
}

export const bearer = (token) => `Bearer ${token}`;

export const REFRESH_COOKIE = 'refresh_token';
export const OAUTH_COOKIE = 'oauth_github';
export const refreshCookie = (res) =>
  (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));

// ── Shortcuts used in authorization tests ──
export const makeActor = (id, role = 'customer') => ({ id, role });
export const accessTokenFor = (container, user) => container.tokenService.signAccessToken(user);

export const TEST_SECRET = config.auth.jwtSecret;

// ── 2.4 helper: registration plus a token, for tests using an authenticated actor ──
export async function registerAsWithToken(app, person = SITA) {
  const user = await registerAs(app, person);
  const { accessToken } = await loginAs(app, person.email, person.password);
  return { user, token: accessToken };
}
