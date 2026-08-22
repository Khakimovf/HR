import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, parseUserRecord } from '@/lib/rbac';
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '@/lib/auth-token';

function isDemoLoginAllowed(): boolean {
  return process.env.ALLOW_DEMO_LOGIN === 'true';
}

function buildAuthResponse(user: ReturnType<typeof parseUserRecord>) {
  return createSessionToken(user).then((token) => {
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  });
}

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

    const fallbackAdminSession = {
      id: 'fallback-super-admin-id',
      fullName: 'Alisher Botirovich Karimov (Super Admin)',
      tabelNumber: 'TB-1000',
      position: 'Bosh Direktor / HR Admin',
      userDepartmentId: 'DEPT-01',
      userDepartmentName: 'Direksiya va Boshqaruv',
      username: 'Admin',
      email: 'admin@enterprise.uz',
      role: 'SUPER_ADMIN' as const,
      allowedModuleKeys: [
        'workforce',
        'departments',
        'arizalar',
        'kpi',
        'svodka',
        'transfers',
        'discipline',
        'davomat',
        'hse',
        'import',
        'audit',
      ],
      assignedDepartmentIds: [] as string[],
    };

    if (
      isDemoLoginAllowed() &&
      cleanUsername === 'admin' &&
      (password === 'Admin123' || password === 'admin' || password === 'admin123')
    ) {
      return buildAuthResponse(fallbackAdminSession as any);
    }

    let user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: {
        departmentAccess: {
          select: { departmentId: true },
        },
        userDepartment: { select: { name: true } },
        moduleAccess: { select: { moduleKey: true, canEdit: true } },
      },
    });

    if (!user) {
      const legacyUser = await prisma.hrUser.findUnique({
        where: { username: cleanUsername },
      });
      if (legacyUser && legacyUser.isActive) {
        const valid = await verifyPassword(password, legacyUser.passwordHash);
        if (valid) {
          return buildAuthResponse(parseUserRecord(legacyUser));
        }
      }
    }

    if (user && user.isActive) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (valid) {
        return buildAuthResponse(parseUserRecord(user));
      }
    }

    return NextResponse.json(
      { success: false, error: "Foydalanuvchi topilmadi yoki parol noto'g'ri" },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
