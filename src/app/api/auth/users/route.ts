import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, parseUserRecord } from '@/lib/rbac';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userDepartment: { select: { id: true, name: true, code: true } },
        departmentAccess: {
          include: {
            department: { select: { id: true, name: true, code: true } },
          },
        },
        moduleAccess: { select: { moduleKey: true, canEdit: true } },
      },
    });

    const parsedUsers = users.map((u) => ({
      ...parseUserRecord(u),
      tabelNumber: u.tabelNumber,
      position: u.position,
      userDepartmentId: u.userDepartmentId,
      userDepartmentName: u.userDepartment?.name,
      email: u.email,
      departmentAccess: u.departmentAccess.map((da) => ({
        id: da.department.id,
        name: da.department.name,
        code: da.department.code,
      })),
      moduleAccess: u.moduleAccess.map((ma) => ({
        moduleKey: ma.moduleKey,
        canEdit: ma.canEdit,
      })),
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, users: parsedUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      tabelNumber,
      position,
      userDepartmentId,
      username,
      email,
      password,
      role = 'HR_OFFICER',
      assignedDepartmentIds = [],
      allowedModuleKeys = [],
    } = body;

    if (!fullName || !username || !password) {
      return NextResponse.json(
        { success: false, error: "F.I.O, Username va Parol kiritilishi shart" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = (email || `${cleanUsername}@enterprise-hr.uz`).trim().toLowerCase();
    const cleanTabel = tabelNumber ? tabelNumber.trim().toUpperCase() : null;

    // Check unique username, email, and tabelNumber
    const existingChecks: any[] = [{ username: cleanUsername }, { email: cleanEmail }];
    if (cleanTabel) existingChecks.push({ tabelNumber: cleanTabel });

    const existingUser = await prisma.user.findFirst({
      where: { OR: existingChecks },
    });

    if (existingUser) {
      let msg = "Ushbu ma'lumot allaqachon mavjud";
      if (existingUser.username === cleanUsername) msg = "Ushbu foydalanuvchi nomi (username) allaqachon mavjud";
      else if (existingUser.email === cleanEmail) msg = "Ushbu email manzili allaqachon ro'yxatdan o'tgan";
      else if (cleanTabel && existingUser.tabelNumber === cleanTabel) msg = `Ushbu Tabel № (${cleanTabel}) allaqachon ishlatilmoqda`;

      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        tabelNumber: cleanTabel || `TB-${Math.floor(1000 + Math.random() * 9000)}`,
        position: position ? position.trim() : 'HR Mutaxassis',
        userDepartmentId: userDepartmentId || null,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role,
        isActive: true,
        departmentAccess: {
          create: (role === 'SUPER_ADMIN' || role === 'EXECUTIVE_DIRECTOR' || role === 'AUDITOR')
            ? []
            : assignedDepartmentIds.map((deptId: string) => ({ departmentId: deptId })),
        },
        moduleAccess: {
          create: allowedModuleKeys.map((mKey: string) => ({ moduleKey: mKey, canEdit: true })),
        },
      },
      include: {
        userDepartment: { select: { id: true, name: true, code: true } },
        departmentAccess: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
        moduleAccess: { select: { moduleKey: true, canEdit: true } },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...parseUserRecord(newUser),
        tabelNumber: newUser.tabelNumber,
        position: newUser.position,
        userDepartmentId: newUser.userDepartmentId,
        userDepartmentName: newUser.userDepartment?.name,
        email: newUser.email,
        departmentAccess: newUser.departmentAccess.map((da) => ({
          id: da.department.id,
          name: da.department.name,
          code: da.department.code,
        })),
        moduleAccess: newUser.moduleAccess.map((ma) => ({
          moduleKey: ma.moduleKey,
          canEdit: ma.canEdit,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      tabelNumber,
      position,
      userDepartmentId,
      username,
      email,
      password,
      role,
      isActive,
      assignedDepartmentIds,
      allowedModuleKeys,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Foydalanuvchi IDsi talab qilinadi' }, { status: 400 });
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (tabelNumber) updateData.tabelNumber = tabelNumber.trim().toUpperCase();
    if (position !== undefined) updateData.position = position ? position.trim() : null;
    if (userDepartmentId !== undefined) updateData.userDepartmentId = userDepartmentId || null;
    if (username) updateData.username = username.trim().toLowerCase();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.passwordHash = await hashPassword(password);

    // Update base user details
    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update department access mapping if provided
    if (assignedDepartmentIds && Array.isArray(assignedDepartmentIds)) {
      await prisma.userDepartmentAccess.deleteMany({ where: { userId: id } });

      if (role !== 'SUPER_ADMIN' && role !== 'EXECUTIVE_DIRECTOR' && role !== 'AUDITOR') {
        await prisma.userDepartmentAccess.createMany({
          data: assignedDepartmentIds.map((deptId: string) => ({
            userId: id,
            departmentId: deptId,
          })),
        });
      }
    }

    // Update module access mapping if provided
    if (allowedModuleKeys && Array.isArray(allowedModuleKeys)) {
      await prisma.userModuleAccess.deleteMany({ where: { userId: id } });

      await prisma.userModuleAccess.createMany({
        data: allowedModuleKeys.map((mKey: string) => ({
          userId: id,
          moduleKey: mKey,
          canEdit: true,
        })),
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userDepartment: { select: { id: true, name: true, code: true } },
        departmentAccess: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
        moduleAccess: { select: { moduleKey: true, canEdit: true } },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
        ? {
            ...parseUserRecord(updatedUser),
            tabelNumber: updatedUser.tabelNumber,
            position: updatedUser.position,
            userDepartmentId: updatedUser.userDepartmentId,
            userDepartmentName: updatedUser.userDepartment?.name,
            email: updatedUser.email,
            departmentAccess: updatedUser.departmentAccess.map((da) => ({
              id: da.department.id,
              name: da.department.name,
              code: da.department.code,
            })),
            moduleAccess: updatedUser.moduleAccess.map((ma) => ({
              moduleKey: ma.moduleKey,
              canEdit: ma.canEdit,
            })),
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
