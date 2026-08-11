import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        children: {
          include: {
            _count: { select: { employees: true } },
          },
        },
        positions: {
          include: {
            reportsToPosition: { select: { id: true, title: true } },
            _count: { select: { employees: true } },
          },
          orderBy: { title: 'asc' },
        },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Build recursive hierarchy tree
    const rootDepartments = departments.filter((d) => !d.parentId);

    return NextResponse.json({
      success: true,
      departments,
      tree: rootDepartments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { code, name, description, parentId, staffLimit } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Bo\'lim nomi majburiy!' },
        { status: 400 }
      );
    }

    // Auto-generate code if empty
    if (!code || !code.trim()) {
      code = `DEPT-${Math.floor(Math.random() * 9000) + 1000}`;
    } else {
      code = code.trim().toUpperCase();
      const existingCode = await prisma.department.findFirst({
        where: { code },
      });
      if (existingCode) {
        code = `${code}-${Math.floor(Math.random() * 900) + 100}`;
      }
    }

    const department = await prisma.department.create({
      data: {
        code,
        name: name.trim(),
        description: description || null,
        parentId: parentId || null,
        staffLimit: staffLimit ? parseInt(staffLimit, 10) : null,
      },
      include: {
        positions: true,
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Yangi bo\'lim muvaffaqiyatli tashkil etildi!',
      department,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { departmentId, staffLimit, name, description } = body;

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Bo\'lim ID talab qilinadi' },
        { status: 400 }
      );
    }

    const data: any = {};
    if (staffLimit !== undefined && staffLimit !== null) {
      const newLimit = parseInt(staffLimit, 10);
      if (!isNaN(newLimit) && newLimit > 0) data.staffLimit = newLimit;
    }
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description;

    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data,
      include: {
        positions: true,
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bo\'lim sozlamalari yangilandi!',
      department: updatedDepartment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
