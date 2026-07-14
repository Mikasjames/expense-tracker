import * as jose from 'jose';

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

export async function verifyToken(
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
