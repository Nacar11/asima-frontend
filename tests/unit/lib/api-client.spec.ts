import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '@/lib/api-client';

describe('ApiClient', () => {
  let client: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    client = new ApiClient({ baseUrl: 'http://api.local/api/v1' });
  });

  it('GET passes Authorization header when access token is set', async () => {
    client.setAccessToken('test-access');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await client.request('GET', '/health');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    const headers = call[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-access');
  });

  it('parses JSON responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', database: 'up' }), { status: 200 }),
    );
    const body = await client.request<{ status: string }>('GET', '/health');
    expect(body.status).toBe('ok');
  });

  it('throws ApiError on non-2xx without refreshing if no handler is set', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Bad' }), { status: 400 }));
    await expect(client.request('GET', '/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('on 401, calls refresh handler exactly once and retries with the new token', async () => {
    client.setAccessToken('stale');
    const refresh = vi.fn().mockResolvedValue('fresh-access');
    client.setRefreshHandler(refresh);

    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const body = await client.request<{ ok: boolean }>('GET', '/me');
    expect(body.ok).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const retryHeaders = fetchMock.mock.calls[1]![1].headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-access');
  });

  it('coalesces concurrent 401 retries through a single refresh promise (mutex)', async () => {
    client.setAccessToken('stale');
    let resolveRefresh: (token: string) => void;
    const refresh = vi.fn().mockImplementation(
      () =>
        new Promise<string>((res) => {
          resolveRefresh = res;
        }),
    );
    client.setRefreshHandler(refresh);

    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 2 }), { status: 200 }));

    const p1 = client.request<{ ok: number }>('GET', '/a');
    const p2 = client.request<{ ok: number }>('GET', '/b');

    // Two parallel callers hit 401 — only one refresh should happen.
    await Promise.resolve();
    resolveRefresh!('fresh-access');

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(r1.ok).toBe(1);
    expect(r2.ok).toBe(2);
  });

  it('throws ApiError with status 401 when refresh handler itself fails', async () => {
    client.setAccessToken('stale');
    client.setRefreshHandler(() => Promise.reject(new Error('refresh failed')));
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));

    await expect(client.request('GET', '/me')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('attaches X-Request-ID to every request', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await client.request('GET', '/health');
    const headers = fetchMock.mock.calls[0]![1].headers as Headers;
    expect(headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{8,}$/i);
  });

  it('postForm sends FormData as-is WITHOUT a Content-Type header (browser sets the boundary)', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    const form = new FormData();
    form.set('leave_type', 'sick');
    form.set('file', new File(['x'], 'a.png', { type: 'image/png' }));

    await client.postForm('/users/me/leave-requests', form);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.body).toBe(form);
    expect((init.headers as Headers).get('Content-Type')).toBeNull();
  });

  it('getBlob returns the response body as a Blob on success', async () => {
    // Use a string body (not a jsdom Blob): the global Response is undici's,
    // which doesn't accept a jsdom Blob as BodyInit and would stringify it to
    // "[object Blob]". A string body + Content-Type header is realm-neutral.
    fetchMock.mockResolvedValue(
      new Response('bytes', { status: 200, headers: { 'Content-Type': 'image/png' } }),
    );
    const blob = await client.getBlob('/leave-requests/1/attachment', {
      params: { version: 'original' },
    });
    // Assert the Blob contract structurally, not by constructor identity or
    // by calling realm-specific methods. Response.blob() yields a Blob whose
    // class differs by realm: undici's (Node 20) vs jsdom's (Node 24) — the
    // latter even lacks .text()/.arrayBuffer(). constructor.name + type +
    // size are present in both, and size === 5 ('bytes') proves the body
    // round-tripped intact (the old jsdom-Blob mock corrupted it to the
    // 13-char "[object Blob]").
    expect(blob.constructor.name).toBe('Blob');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(5);
  });

  it('getBlob still throws ApiError on a non-2xx (e.g. 403)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'no' }), { status: 403 }));
    await expect(client.getBlob('/leave-requests/1/attachment')).rejects.toBeInstanceOf(ApiError);
  });
});
