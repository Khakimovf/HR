import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, parseUserRecord } from '@/lib/rbac';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Try User model
    let user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: {
        departmentAccess: {
          select: { departmentId: true },
        },
      },
    });

    // 2. Fallback to HrUser model
    if (!user) {
      const legacyUser = await prisma.hrUser.findUnique({
        where: { username: cleanUsername },
      });
      if (legacyUser && legacyUser.isActive) {
        const valid = await verifyPassword(password, legacyUser.passwordHash);
        if (!valid) {
          return NextResponse.json({ success: false, error: "Parol noto'g'ri" }, { status: 401 });
        }
        return NextResponse.json({ success: true, user: parseUserRecord(legacyUser) });
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Foydalanuvchi topilmadi yoki bloklangan" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Parol noto'g'ri" },
        { status: 401 }
      );
    }

    const session = parseUserRecord(user);
    return NextResponse.json({ success: true, user: session });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
