import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-token';

export async function GET(req: Request) {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, user: null });
  }
  return NextResponse.json({ success: true, user });
}
