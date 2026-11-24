import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN,
  RAM,
  SITA,
  bearer,
  buildTestApp,
  loginAs,
  refreshCookie,
  registerAs,
} from '../helpers.js';

const AUTH = '/api/v1/auth';
const cookieValue = (cookie) => cookie.split(';')[0];

describe('Auth API (integration)', () => {
  let app;
  let container;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
  });

  it('POST /register is public and always creates role=customer', async () => {
    const res = await request(app).post(`${AUTH}/register`).send(SITA);
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('register cannot pick a role (unknown field → 400)', async () => {
    const res = await request(app).post(`${AUTH}/register`).send({ ...SITA, role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('duplicate email → 409', async () => {
    await request(app).post(`${AUTH}/register`).send(SITA);
    const res = await request(app).post(`${AUTH}/register`).send(SITA);
    expect(res.status).toBe(409);
  });

  it('login returns a bearer token and an httpOnly refresh cookie', async () => {
    await request(app).post(`${AUTH}/register`).send(SITA);
    const res = await request(app).post(`${AUTH}/login`).send({ email: SITA.email, password: SITA.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/^refresh_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('wrong password → 401', async () => {
    await request(app).post(`${AUTH}/register`).send(SITA);
    const res = await request(app).post(`${AUTH}/login`).send({ email: SITA.email, password: 'Wrong123' });
    expect(res.status).toBe(401);
  });

  it('GET /me with a valid token → 200', async () => {
    const { accessToken } = await loginAs(app, ADMIN.email, ADMIN.password);
    const res = await request(app).get(`${AUTH}/me`).set('Authorization', bearer(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN.email.toLowerCase());
  });

  it('GET /me without a token → 401', async () => {
    expect((await request(app).get(`${AUTH}/me`)).status).toBe(401);
  });

  it('refresh rotates the token and issues a new cookie', async () => {
    const login = await request(app).post(`${AUTH}/login`).send({ email: ADMIN.email, password: ADMIN.password });
    const old = refreshCookie(login);
    const res = await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(old));
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(refreshCookie(res)).toBeTruthy();
    expect(refreshCookie(res)).not.toBe(old);
  });

  it('reusing an old refresh cookie → 401 and revokes the family', async () => {
    const login = await request(app).post(`${AUTH}/login`).send({ email: ADMIN.email, password: ADMIN.password });
    const old = refreshCookie(login);
    const rotated = await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(old));
    expect(rotated.status).toBe(200);
    expect((await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(old))).status).toBe(401);
    expect((await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(refreshCookie(rotated)))).status).toBe(401);
  });

  it('logout with no body works and invalidates the refresh cookie', async () => {
    const login = await request(app).post(`${AUTH}/login`).send({ email: ADMIN.email, password: ADMIN.password });
    const cookie = refreshCookie(login);
    expect((await request(app).post(`${AUTH}/logout`).set('Cookie', cookieValue(cookie))).status).toBe(204);
    expect((await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(cookie))).status).toBe(401);
  });

  it('PATCH /password → 204', async () => {
    const sita = await registerAs(app);
    const token = (await loginAs(app, SITA.email, SITA.password)).accessToken;
    const res = await request(app)
      .patch(`${AUTH}/password`)
      .set('Authorization', bearer(token))
      .send({ currentPassword: SITA.password, newPassword: 'NewSecret456' });
    expect(res.status).toBe(204);
    expect(sita.id).toBeTruthy();
  });

  it('PATCH /password with wrong current password → 401', async () => {
    await registerAs(app);
    const token = (await loginAs(app, SITA.email, SITA.password)).accessToken;
    const res = await request(app)
      .patch(`${AUTH}/password`)
      .set('Authorization', bearer(token))
      .send({ currentPassword: 'Wrong123', newPassword: 'NewSecret456' });
    expect(res.status).toBe(401);
  });

  it('changing the password revokes every refresh token', async () => {
    await registerAs(app);
    const token = (await loginAs(app, SITA.email, SITA.password)).accessToken;
    const login = await request(app).post(`${AUTH}/login`).send({ email: SITA.email, password: SITA.password });
    const cookie = refreshCookie(login);
    await request(app)
      .patch(`${AUTH}/password`)
      .set('Authorization', bearer(token))
      .send({ currentPassword: SITA.password, newPassword: 'NewSecret456' });
    expect((await request(app).post(`${AUTH}/refresh`).set('Cookie', cookieValue(cookie))).status).toBe(401);
  });

  it('GitHub routes return 404 when OAuth is not configured', async () => {
    expect((await request(app).get(`${AUTH}/github`)).status).toBe(404);
  });
});
