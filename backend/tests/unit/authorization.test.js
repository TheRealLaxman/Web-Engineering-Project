import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { can } from '../../src/auth/policies.js';
import {
  ADMIN,
  RAM,
  SITA,
  accessTokenFor,
  bearer,
  buildTestApp,
  loginAs,
  makeActor,
  registerAs,
} from '../helpers.js';

const USERS = '/api/v1/users';

describe('can() — ABAC policy function', () => {
  const admin = makeActor('a1', 'admin');
  const sita = makeActor('u1', 'customer');

  it('admin can read anyone', () => {
    expect(can(admin, 'users:read', { id: 'u1' })).toBe(true);
  });

  it('customer can read themselves', () => {
    expect(can(sita, 'users:read', { id: 'u1' })).toBe(true);
  });

  it('customer CANNOT read another user', () => {
    expect(can(sita, 'users:read', { id: 'u2' })).toBe(false);
  });

  it('admin cannot delete themselves', () => {
    expect(can(admin, 'users:delete', { id: 'a1' })).toBe(false);
  });

  it('admin CAN delete another user', () => {
    expect(can(admin, 'users:delete', { id: 'u1' })).toBe(true);
  });

  it('unknown action throws loudly (a typo must never silently allow)', () => {
    expect(() => can(admin, 'users:destroy', { id: 'u1' })).toThrow(/Unknown action/);
  });
});

describe('requireRole (RBAC) on routes', () => {
  let app;
  let container;
  let adminToken;
  let customerToken;
  let customer;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
    adminToken = (await loginAs(app, ADMIN.email, ADMIN.password)).accessToken;
    customer = await registerAs(app);
    customerToken = accessTokenFor(container, customer);
  });

  it('admin can GET /users', async () => {
    const res = await request(app).get(USERS).set('Authorization', bearer(adminToken));
    expect(res.status).toBe(200);
  });

  it('customer gets 403 on GET /users', async () => {
    const res = await request(app).get(USERS).set('Authorization', bearer(customerToken));
    expect(res.status).toBe(403);
  });

  it('admin can POST /users', async () => {
    const res = await request(app)
      .post(USERS)
      .set('Authorization', bearer(adminToken))
      .send(RAM);
    expect(res.status).toBe(201);
  });

  it('customer gets 403 on POST /users', async () => {
    const res = await request(app)
      .post(USERS)
      .set('Authorization', bearer(customerToken))
      .send(RAM);
    expect(res.status).toBe(403);
  });

  it('customer CAN GET their own /users/:id', async () => {
    const res = await request(app)
      .get(`${USERS}/${customer.id}`)
      .set('Authorization', bearer(customerToken));
    expect(res.status).toBe(200);
  });
});

describe('requirePermission (ABAC) on routes', () => {
  let app;
  let container;
  let adminToken;
  let sita;
  let ram;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
    adminToken = (await loginAs(app, ADMIN.email, ADMIN.password)).accessToken;
    sita = await registerAs(app, SITA);
    ram = await registerAs(app, RAM);
  });

  it('customer can read themselves', async () => {
    const token = accessTokenFor(container, sita);
    const res = await request(app).get(`${USERS}/${sita.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(200);
  });

  it('customer cannot read another user', async () => {
    const token = accessTokenFor(container, sita);
    const res = await request(app).get(`${USERS}/${ram.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(403);
  });

  it('admin can read another user', async () => {
    const res = await request(app).get(`${USERS}/${sita.id}`).set('Authorization', bearer(adminToken));
    expect(res.status).toBe(200);
  });

  it('customer cannot DELETE themselves', async () => {
    const token = accessTokenFor(container, sita);
    const res = await request(app).delete(`${USERS}/${sita.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(403);
  });

  it('admin can DELETE another user', async () => {
    const res = await request(app).delete(`${USERS}/${ram.id}`).set('Authorization', bearer(adminToken));
    expect(res.status).toBe(204);
    expect((await request(app).get(`${USERS}/${ram.id}`).set('Authorization', bearer(adminToken))).status).toBe(404);
  });
});

describe('role changes in the token', () => {
  let app;
  let container;
  let sita;
  let oldToken;
  let adminToken;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
    adminToken = (await loginAs(app, ADMIN.email, ADMIN.password)).accessToken;
    sita = await registerAs(app, SITA);
    oldToken = accessTokenFor(container, sita);
    await request(app)
      .patch(`${USERS}/${sita.id}/role`)
      .set('Authorization', bearer(adminToken))
      .send({ role: 'admin' });
  });

  it('old token keeps the old role and is now 403 for admin routes', async () => {
    const res = await request(app).get(USERS).set('Authorization', bearer(oldToken));
    expect(res.status).toBe(403);
  });

  it('a freshly signed token has the new role and works', async () => {
    const updated = await container.usersService.getById(sita.id);
    const fresh = accessTokenFor(container, updated);
    const res = await request(app).get(USERS).set('Authorization', bearer(fresh));
    expect(res.status).toBe(200);
  });
});

describe('changeRole (RBAC: admin only)', () => {
  let app;
  let container;
  let adminToken;
  let sita;
  let customerToken;

  beforeEach(async () => {
    ({ app, container } = await buildTestApp());
    adminToken = (await loginAs(app, ADMIN.email, ADMIN.password)).accessToken;
    sita = await registerAs(app, SITA);
    customerToken = accessTokenFor(container, sita);
  });

  it('customer cannot change roles', async () => {
    const res = await request(app)
      .patch(`${USERS}/${sita.id}/role`)
      .set('Authorization', bearer(customerToken))
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });

  it('admin can promote another user', async () => {
    const res = await request(app)
      .patch(`${USERS}/${sita.id}/role`)
      .set('Authorization', bearer(adminToken))
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });
});
