import { AwsClient } from 'aws4fetch';
import * as jose from 'jose';
import { verifyToken } from './auth';

interface Env {
  B2_ACCESS_KEY_ID: string;
  B2_SECRET_ACCESS_KEY: string;
  B2_ENDPOINT: string;
  B2_BUCKET: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
}

function createAwsClient(env: Env) {
  const region = env.B2_ENDPOINT.match(/^(?:https?:\/\/)?s3\.(.+)\.backblazeb2\.com$/)?.[1] ?? 'us-east-005';
  return new AwsClient({
    accessKeyId: env.B2_ACCESS_KEY_ID,
    secretAccessKey: env.B2_SECRET_ACCESS_KEY,
    service: 's3',
    region,
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

function corsHeaders(origin: string): Record<string, string> {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'ETag',
  } as Record<string, string>;
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export { getOrigin, corsHeaders, json, getS3Url, createAwsClient };
export type { Env };

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

      function presignUrl(method: string, key: string, headers?: Record<string, string>) {
        const url = new URL(getS3Url(env, key));
        url.searchParams.set('X-Amz-Expires', '3600');
        return aws.sign(
          new Request(url.toString(), { method, headers }),
          { aws: { signQuery: true, allHeaders: !!headers } },
        );
      }

      if (request.method === 'POST' && path === '/api/uploads') {
        const { fileName, contentType } = (await request.json()) as {
          fileName: string;
          contentType: string;
        };
        const fileId = crypto.randomUUID();
        const key = `${userId}/${fileId}`;

        const signed = await presignUrl('PUT', key, {
          'Content-Type': contentType || 'application/pdf',
        });

        return json({ fileId, uploadUrl: signed.url }, 200, cors);
      }

      if (request.method === 'GET' && path.startsWith('/api/downloads/')) {
        const fileId = path.split('/').pop()!;
        if (!fileId) return json({ error: 'Missing file ID' }, 400, cors);

        const key = `${userId}/${fileId}`;
        const signed = await presignUrl('GET', key);

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
      if (err instanceof jose.errors.JWTExpired) {
        return json({ error: 'Token expired' }, 401, cors);
      }
      if (err instanceof jose.errors.JOSEError) {
        return json({ error: 'Invalid token' }, 401, cors);
      }
      console.error('Worker error:', err);
      return json({ error: 'Internal server error' }, 500, cors);
    }
  },
};
