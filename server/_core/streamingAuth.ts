import { SignJWT, jwtVerify } from 'jose';
import { ENV } from './env';

const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds — just enough for client to establish WebSocket connection

const getSecretKey = () => {
  if (!ENV.cookieSecret) {
    throw new Error('[StreamingAuth] Missing JWT_SECRET / cookie secret');
  }
  return new TextEncoder().encode(ENV.cookieSecret);
};

export type StreamingTokenPayload = {
  sessionId: string;
  userId: number;
};

export async function signStreamingToken(
  payload: StreamingTokenPayload,
  options: { expiresInMs?: number } = {},
): Promise<string> {
  const ttl = options.expiresInMs ?? DEFAULT_TTL_MS;
  const expiresAt = Math.floor((Date.now() + ttl) / 1000);
  const secret = getSecretKey();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifyStreamingToken(token: string): Promise<StreamingTokenPayload> {
  const secret = getSecretKey();
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  const { sessionId, userId } = payload as Record<string, unknown>;

  if (typeof sessionId !== 'string' || typeof userId !== 'number') {
    throw new Error('Invalid streaming token payload');
  }

  return { sessionId, userId };
}
