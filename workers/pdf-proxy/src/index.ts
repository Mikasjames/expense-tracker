import { AwsClient } from 'aws4fetch';
import * as jose from 'jose';

interface Env {
  B2_ACCESS_KEY_ID: string;
  B2_SECRET_ACCESS_KEY: string;
  B2_ENDPOINT: string;
  B2_BUCKET: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
}

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedJWKS: ReturnType<typeof jose.createLocalJWKSet> | null = null;

async function getJWKS() {
  if (!cachedJWKS) {
    const response = await fetch(JWKS_URL);
    const data: { keys: jose.JWK[] } = await response.json();
    cachedJWKS = jose.createLocalJWKSet(data);
  }
  return cachedJWKS;
}

async function verifyToken(
  token: string,
  projectId: string,
): Promise<jose.JWTPayload> {
  const jwks = await getJWKS();
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload;
}

function createAwsClient(env: Env) {
  return new AwsClient({
    accessKeyId: env.B2_ACCESS_KEY_ID,
    secretAccessKey: env.B2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'us-west-000',
  });
}

function getS3Url(env: Env, key: string) {
  return `https://${env.B2_ENDPOINT}/${env.B2_BUCKET}/${key}`;
}

function getOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  if (allowed.includes(origin)) return origin;
  return '';
}

function corsHeaders(origin: string) {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'ETag',
  };
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = getOrigin(request, env);
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Unauthorized' }, 401, cors);
      }

      const payload = await verifyToken(authHeader.slice(7), env.FIREBASE_PROJECT_ID);
      const userId = payload.sub;
      if (!userId) {
        return json({ error: 'Invalid token' }, 401, cors);
      }

      const aws = createAwsClient(env);

      if (request.method === 'POST' && path === '/api/uploads') {
        const { fileName, contentType } = (await request.json()) as {
          fileName: string;
          contentType: string;
        };
        const fileId = crypto.randomUUID();
        const key = `${userId}/${fileId}`;
        const s3Url = getS3Url(env, key);

        const signed = await aws.sign(
          new Request(s3Url, {
            method: 'PUT',
            headers: { 'Content-Type': contentType || 'application/pdf' },
          }),
          { signQuery: true, expiresIn: 3600 },
        );

        return json({ fileId, uploadUrl: signed.url }, 200, cors);
      }

      if (request.method === 'GET' && path.startsWith('/api/downloads/')) {
        const fileId = path.split('/').pop()!;
        if (!fileId) return json({ error: 'Missing file ID' }, 400, cors);

        const key = `${userId}/${fileId}`;
        const s3Url = getS3Url(env, key);

        const signed = await aws.sign(
          new Request(s3Url, { method: 'GET' }),
          { signQuery: true, expiresIn: 3600 },
        );

        return json({ downloadUrl: signed.url }, 200, cors);
      }

      if (request.method === 'DELETE' && path.startsWith('/api/uploads/')) {
        const fileId = path.split('/').pop()!;
        if (!fileId) return json({ error: 'Missing file ID' }, 400, cors);

        const key = `${userId}/${fileId}`;
        const s3Url = getS3Url(env, key);

        const response = await aws.fetch(s3Url, { method: 'DELETE' });
        if (!response.ok) {
          return json(
            { error: 'Failed to delete file from storage' },
            response.status,
            cors,
          );
        }

        return json({ success: true }, 200, cors);
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error('Worker error:', err);
      if (err instanceof jose.errors.JWTExpired) {
        return json({ error: 'Token expired' }, 401, cors);
      }
      if (err instanceof jose.errors.JWTInvalid) {
        return json({ error: 'Invalid token' }, 401, cors);
      }
      return json({ error: 'Internal server error' }, 500, cors);
    }
  },
};
