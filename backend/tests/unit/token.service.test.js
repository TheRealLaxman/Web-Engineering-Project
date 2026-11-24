import { beforeEach, describe, expect, it } from 'vitest';
import { RefreshTokensRepository } from '../../src/repositories/refresh-tokens.repository.js';
import { UsersRepository } from '../../src/repositories/users.repository.js';
import { TokenService } from '../../src/services/token.service.js';
import { UsersService } from '../../src/services/users.service.js';
import { fakeHash, fakeVerify } from '../helpers.js';

const opts = {
  jwtSecret: 'test-secret-that-is-at-least-32-characters-long',
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 7,
  issuer: 'users-api',
  audience: 'users-api',
};

describe('TokenService', () => {
  let tokens;
  let users;
  let user;

  beforeEach(async () => {
    tokens = new TokenService(new RefreshTokensRepository(), opts);
    users = new UsersService(new UsersRepository(), { hash: fakeHash, verify: fakeVerify });
    user = await users.create({ firstName: 'Sita', lastName: 'G', email: 'sita@test.com', password: 'Secret123' }, { role: 'customer' });
  });

  it('signs an HS256 JWT with sub + role + expiry', () => {
    const token = tokens.signAccessToken(user);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('customer');
    expect(payload.iss).toBe('users-api');
    expect(payload.aud).toBe('users-api');
    expect(payload.exp - payload.iat).toBe(900);
  });

  it('verifyAccessToken returns { id, role }', () => {
    expect(tokens.verifyAccessToken(tokens.signAccessToken(user))).toEqual({ id: user.id, role: 'customer' });
  });

  it('verifyAccessToken rejects a garbage token', () => {
    expect(() => tokens.verifyAccessToken('not-a-jwt')).toThrow();
  });

  it('verifyAccessToken rejects a token signed with another secret', () => {
    const other = new TokenService(new RefreshTokensRepository(), { ...opts, jwtSecret: 'a-completely-different-secret-value-123' });
    expect(() => tokens.verifyAccessToken(other.signAccessToken(user))).toThrow();
  });

  it('verifyAccessToken rejects alg:none', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: user.id, role: 'admin' })).toString('base64url');
    expect(() => tokens.verifyAccessToken(`${header}.${payload}.`)).toThrow();
  });

  it('refresh tokens are random and not stored in plaintext', async () => {
    const { token } = await tokens.issueRefreshToken(user.id);
    expect(token).not.toContain(user.id);
    const rows = await tokens.refreshTokens.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token);
    expect(rows[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rotateRefreshToken issues a new token in the SAME family', async () => {
    const first = await tokens.issueRefreshToken(user.id);
    const rotated = await tokens.rotateRefreshToken(first.token);
    expect(rotated.userId).toBe(user.id);
    expect(rotated.refresh.token).not.toBe(first.token);
    const rows = await tokens.refreshTokens.findAll();
    expect(rows.every((r) => r.familyId === first.id || r.familyId === rows[0].familyId)).toBe(true);
    expect(new Set(rows.map((r) => r.familyId)).size).toBe(1);
  });

  it('rotating revokes the old row and records replacedBy', async () => {
    const first = await tokens.issueRefreshToken(user.id);
    const rotated = await tokens.rotateRefreshToken(first.token);
    const old = await tokens.refreshTokens.findByHash(
      (await import('node:crypto')).createHash('sha256').update(first.token).digest('hex'),
    );
    expect(old.revokedAt).toBeTruthy();
    expect(old.replacedBy).toBe(rotated.refresh.id);
  });

  it('reusing an old token revokes the WHOLE family', async () => {
    const first = await tokens.issueRefreshToken(user.id);
    const rotated = await tokens.rotateRefreshToken(first.token);
    await expect(tokens.rotateRefreshToken(first.token)).rejects.toMatchObject({ status: 401 });
    const rows = await tokens.refreshTokens.findAll();
    expect(rows.every((r) => Boolean(r.revokedAt))).toBe(true);
    expect(rotated.refresh.token).toBeTruthy();
  });

  it('revokeRefreshToken kills every token in the family', async () => {
    const first = await tokens.issueRefreshToken(user.id);
    const rotated = await tokens.rotateRefreshToken(first.token);
    await tokens.revokeRefreshToken(rotated.refresh.token);
    await expect(tokens.rotateRefreshToken(rotated.refresh.token)).rejects.toMatchObject({ status: 401 });
  });

  it('revokeAllForUser revokes all sessions', async () => {
    const a = await tokens.issueRefreshToken(user.id);
    const b = await tokens.issueRefreshToken(user.id, 'other-family');
    await tokens.revokeAllForUser(user.id);
    await expect(tokens.rotateRefreshToken(a.token)).rejects.toMatchObject({ status: 401 });
    await expect(tokens.rotateRefreshToken(b.token)).rejects.toMatchObject({ status: 401 });
  });
});
