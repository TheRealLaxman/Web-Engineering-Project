import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GithubOAuthClient } from '../../src/services/github-oauth.client.js';
import { SITA, buildTestApp, refreshCookie, registerAs } from '../helpers.js';

const AUTH = '/api/v1/auth';
const githubConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  callbackUrl: 'http://localhost:3000/api/v1/auth/github/callback',
};

const oauthCookie = (res) => (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('oauth_github='));
const parseOauth = (cookie) => JSON.parse(decodeURIComponent(cookie.split(';')[0].slice('oauth_github='.length)));

describe('GitHub OAuth (integration, fake fetch)', () => {
  let app;
  let container;
  let fetchMock;

  beforeEach(async () => {
    fetchMock = vi.fn(async (url, init) => {
      if (url.includes('access_token')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'gho_test_token' }) };
      }
      if (String(url).endsWith('/user')) {
        return { ok: true, status: 200, json: async () => ({ id: 424242, login: 'sita-git', name: 'Sita Gurung' }) };
      }
      if (String(url).endsWith('/user/emails')) {
        return { ok: true, status: 200, json: async () => ([{ email: SITA.email, primary: true, verified: true }]) };
      }
      throw new Error(`Unexpected fetch: ${url} ${JSON.stringify(init?.body ?? {})}`);
    });
    const githubClient = new GithubOAuthClient(githubConfig, { fetch: fetchMock });
    ({ app, container } = await buildTestApp({ githubClient }));
  });

  const start = () => request(app).get(`${AUTH}/github`);

  it('GET /github redirects to GitHub with client_id, state and PKCE challenge', async () => {
    const res = await start();
    expect(res.status).toBe(302);
    const url = new URL(res.headers.location);
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe(githubConfig.clientId);
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  it('GET /github sets the one-time oauth cookie with state + verifier', async () => {
    const res = await start();
    const saved = parseOauth(oauthCookie(res));
    expect(saved.state).toBeTruthy();
    expect(saved.verifier).toBeTruthy();
    expect(saved.verifier).not.toBe(saved.state);
  });

  it('callback without the oauth cookie → 401', async () => {
    const res = await request(app).get(`${AUTH}/github/callback?state=abc&code=xyz`);
    expect(res.status).toBe(401);
  });

  it('callback with a mismatched state → 401', async () => {
    const cookie = oauthCookie(await start());
    const res = await request(app)
      .get(`${AUTH}/github/callback?state=WRONG&code=xyz`)
      .set('Cookie', cookie.split(';')[0]);
    expect(res.status).toBe(401);
  });

  it('callback with error=access_denied → 401', async () => {
    const cookie = oauthCookie(await start());
    const { state } = parseOauth(cookie);
    const res = await request(app)
      .get(`${AUTH}/github/callback?state=${state}&error=access_denied`)
      .set('Cookie', cookie.split(';')[0]);
    expect(res.status).toBe(401);
  });

  it('callback with valid state but no code → 400', async () => {
    const cookie = oauthCookie(await start());
    const { state } = parseOauth(cookie);
    const res = await request(app)
      .get(`${AUTH}/github/callback?state=${state}`)
      .set('Cookie', cookie.split(';')[0]);
    expect(res.status).toBe(400);
  });

  it('happy path logs in a new GitHub user and issues tokens', async () => {
    const cookie = oauthCookie(await start());
    const { state } = parseOauth(cookie);
    const res = await request(app)
      .get(`${AUTH}/github/callback?state=${state}&code=one-time-code`)
      .set('Cookie', cookie.split(';')[0]);
    expect(res.status).toBe(200);
    expect(res.body.data.user.githubId).toBe('424242');
    expect(res.body.data.accessToken).toBeTruthy();
    expect(refreshCookie(res)).toMatch(/^refresh_token=/);
  });

  it('happy path links by verified email instead of creating a duplicate', async () => {
    const local = await registerAs(app, SITA);
    const cookie = oauthCookie(await start());
    const { state } = parseOauth(cookie);
    const res = await request(app)
      .get(`${AUTH}/github/callback?state=${state}&code=one-time-code`)
      .set('Cookie', cookie.split(';')[0]);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(local.id);
    expect((await container.usersRepository.findAll()).filter((u) => u.email === SITA.email)).toHaveLength(1);
  });

  it('sends the PKCE verifier to GitHub and uses the returned token for profile calls', async () => {
    const cookie = oauthCookie(await start());
    const { state, verifier } = parseOauth(cookie);
    await request(app)
      .get(`${AUTH}/github/callback?state=${state}&code=one-time-code`)
      .set('Cookie', cookie.split(';')[0]);
    const exchangeCall = fetchMock.mock.calls.find(([url]) => String(url).includes('access_token'));
    expect(JSON.parse(exchangeCall[1].body).code_verifier).toBe(verifier);
    const profileCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('api.github.com'));
    expect(profileCalls).toHaveLength(2);
    expect(profileCalls[0][1].headers.Authorization).toBe('Bearer gho_test_token');
  });
});
