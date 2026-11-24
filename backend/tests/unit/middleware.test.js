import { describe, expect, it, vi } from 'vitest';
import { requireJson } from '../../src/middleware/require-json.js';
import { validateIdParam } from '../../src/middleware/validate-id.js';

describe('requireJson', () => {
  const fakeReq = ({ method = 'POST', isJson = false, contentLength, transferEncoding } = {}) => ({
    method,
    is: () => (isJson ? 'application/json' : false),
    get: (name) => (name.toLowerCase() === 'content-length' ? contentLength : name.toLowerCase() === 'transfer-encoding' ? transferEncoding : undefined),
  });

  it('lets GET through without a body', () => {
    const next = vi.fn();
    requireJson(fakeReq({ method: 'GET' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('lets a JSON POST through', () => {
    const next = vi.fn();
    requireJson(fakeReq({ isJson: true, contentLength: '10' }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['POST', 'PUT', 'PATCH'])('rejects a non-JSON %s with 415', (method) => {
    const next = vi.fn();
    requireJson(fakeReq({ method, contentLength: '10' }), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 415 });
  });

  it('allows a BODYLESS POST (refresh / logout / OAuth callback)', () => {
    const next = vi.fn();
    requireJson(fakeReq({ method: 'POST', contentLength: undefined }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a chunked non-JSON body too', () => {
    const next = vi.fn();
    requireJson(fakeReq({ transferEncoding: 'chunked' }), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 415 });
  });
});

describe('validateIdParam', () => {
  it('accepts a UUID', () => {
    const next = vi.fn();
    validateIdParam({}, {}, next, '15cfde80-9253-4e58-a113-a87a9e67498a');
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['123', 'abc', '15cfde80-9253-4e58-a113'])('rejects %s with 400', (id) => {
    const next = vi.fn();
    validateIdParam({}, {}, next, id);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400, detail: 'id must be a valid UUID' });
  });
});
