import { NextResponse } from 'next/server';
import { SESSION_COOKIE, clearSessionCookieOptions } from '@/lib/auth-token';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', clearSessionCookieOptions());
  return response;
}
