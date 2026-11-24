import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';
import { ADMIN, RAM, SITA, accessTokenFor, bearer, buildTestApp, loginAs, registerAs } from '../helpers.js';

const USERS = '/api/v1/users';

describe('Users API with auth (integration)', () => {
  let app;
  let container;
  let adminToken;
  let sitaToken;
  let sita;
  let ram;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
    adminToken = (await loginAs(app, ADMIN.email, ADMIN.password)).accessToken;
    sita = await registerAs(app, SITA);
    ram = await registerAs(app, RAM);
    sitaToken = accessTokenFor(container, sita);
  });

  it('GET /users without a token → 401', async () => {
    const res = await request(app).get(USERS);
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toMatch(/Bearer/);
  });

  it('admin can list users', async () => {
    const res = await request(app).get(USERS).set('Authorization', bearer(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('customer cannot list users → 403', async () => {
    const res = await request(app).get(USERS).set('Authorization', bearer(sitaToken));
    expect(res.status).toBe(403);
  });

  it('customer CAN read their own record', async () => {
    const res = await request(app).get(`${USERS}/${sita.id}`).set('Authorization', bearer(sitaToken));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(SITA.email);
  });

  it('customer cannot read another record → 403', async () => {
    const res = await request(app).get(`${USERS}/${ram.id}`).set('Authorization', bearer(sitaToken));
    expect(res.status).toBe(403);
  });

  it('requireJson still gives 415 for a form-encoded POST', async () => {
    const res = await request(app)
      .post(USERS)
      .set('Authorization', bearer(adminToken))
      .type('form')
      .send('firstName=Sita');
    expect(res.status).toBe(415);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('validateIdParam still gives 400', async () => {
    const res = await request(app).get(`${USERS}/123`).set('Authorization', bearer(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.detail).toBe('id must be a valid UUID');
  });

  it('a valid but unknown UUID still gives 404', async () => {
    const res = await request(app)
      .get(`${USERS}/15cfde80-9253-4e58-a113-a87a9e67498a`)
      .set('Authorization', bearer(adminToken));
    expect(res.status).toBe(404);
  });

  it('a fake service can still replace the real one entirely', async () => {
    const fakeService = {
      list: async () => ({
        data: [{ id: 'x', firstName: 'Fake' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const fakeApp = createApp(createContainer({ usersService: fakeService }));
    const token = accessTokenFor(container, { id: 'admin', role: 'admin' });
    const res = await request(fakeApp).get(USERS).set('Authorization', bearer(token));
    expect(res.body.data).toEqual([{ id: 'x', firstName: 'Fake' }]);
  });
});
