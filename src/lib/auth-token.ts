import { SignJWT, jwtVerify } from 'jose';
import type { UserSession } from './rbac';

export const SESSION_COOKIE = 'hr_session';

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'dev-only-auth-secret-change-me-in-production');

  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required in production');
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const user = (payload as { user?: UserSession }).user;
    if (!user?.id) return null;
    return user;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === SESSION_COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

export async function getSessionFromRequest(req: Request): Promise<UserSession | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function clearSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}
