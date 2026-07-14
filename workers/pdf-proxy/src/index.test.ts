import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from './index';

vi.mock('./auth', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'test-user' }),
}));

const { default: worker, getOrigin, corsHeaders, getS3Url, createAwsClient } =
  await import('./index');

function mockEnv(overrides: Partial<Env> = {}): Env {
  return {
    B2_ACCESS_KEY_ID: 'test-key-id',
    B2_SECRET_ACCESS_KEY: 'test-secret',
    B2_ENDPOINT: 's3.us-west-004.backblazeb2.com',
    B2_BUCKET: 'test-bucket',
    FIREBASE_PROJECT_ID: 'test-project',
    ALLOWED_ORIGINS: 'http://localhost:4200,https://example.com',
    ...overrides,
  };
}

const authHeaders = { Authorization: 'Bearer mock-valid-token' };

describe('getOrigin', () => {
  it('returns origin when allowed', () => {
    const request = new Request('https://worker.dev/api/uploads', {
      headers: { Origin: 'http://localhost:4200' },
    });
    expect(getOrigin(request, mockEnv())).toBe('http://localhost:4200');
  });

  it('returns empty string when origin is not allowed', () => {
    const request = new Request('https://worker.dev/api/uploads', {
      headers: { Origin: 'https://evil.com' },
    });
    expect(getOrigin(request, mockEnv())).toBe('');
  });

  it('returns empty string when no origin header', () => {
    const request = new Request('https://worker.dev/api/uploads');
    expect(getOrigin(request, mockEnv())).toBe('');
  });
});

describe('corsHeaders', () => {
  it('returns empty object for empty origin', () => {
    expect(corsHeaders('')).toEqual({});
  });

  it('returns CORS headers for valid origin', () => {
    const headers = corsHeaders('http://localhost:4200');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4200');
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
    expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(headers['Access-Control-Max-Age']).toBe('86400');
  });
});

describe('getS3Url', () => {
  it('constructs correct S3 URL', () => {
    const env = mockEnv();
    const url = getS3Url(env, 'user123/file-uuid');
    expect(url).toBe(
      'https://s3.us-west-004.backblazeb2.com/test-bucket/user123/file-uuid',
    );
  });
});

describe('createAwsClient', () => {
  it('creates AwsClient with env credentials', () => {
    const env = mockEnv();
    const client = createAwsClient(env);
    expect(client.accessKeyId).toBe('test-key-id');
    expect(client.secretAccessKey).toBe('test-secret');
    expect(client.service).toBe('s3');
    expect(client.region).toBe('us-west-004');
  });
});

describe('worker fetch handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header', async () => {
    const request = new Request('https://worker.dev/api/uploads', {
      method: 'POST',
    });
    const response = await worker.fetch(request, mockEnv());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 for unknown route', async () => {
    const request = new Request('https://worker.dev/api/unknown', {
      headers: authHeaders,
    });
    const response = await worker.fetch(request, mockEnv());
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Not found' });
  });

  it('handles OPTIONS preflight with CORS', async () => {
    const request = new Request('https://worker.dev/api/uploads', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:4200' },
    });
    const response = await worker.fetch(request, mockEnv());
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:4200',
    );
  });

  it('returns 400 for DELETE with missing file ID', async () => {
    const request = new Request('https://worker.dev/api/uploads/', {
      method: 'DELETE',
      headers: authHeaders,
    });
    const response = await worker.fetch(request, mockEnv());
    expect(response.status).toBe(400);
  });

  it('returns 400 for GET download with missing file ID', async () => {
    const request = new Request('https://worker.dev/api/downloads/', {
      method: 'GET',
      headers: authHeaders,
    });
    const response = await worker.fetch(request, mockEnv());
    expect(response.status).toBe(400);
  });
});
