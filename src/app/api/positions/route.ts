import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId') || '';

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        reportsToPosition: { select: { id: true, title: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ success: true, positions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { departmentId, title, quotaLimit = 1, reportsToPositionId } = body;

    if (!departmentId || !title) {
      return NextResponse.json(
        { success: false, error: 'Bo\'lim va lavozim nomi majburiy!' },
        { status: 400 }
      );
    }

    const position = await prisma.position.create({
      data: {
        departmentId,
        title: title.trim(),
        quotaLimit: parseInt(quotaLimit, 10) || 1,
        reportsToPositionId: reportsToPositionId || null,
      },
      include: {
        department: true,
        reportsToPosition: true,
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Yangi lavozim muvaffaqiyatli qo\'shildi!',
      position,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, quotaLimit, reportsToPositionId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lavozim ID kiritilmadi' },
        { status: 400 }
      );
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        title: title ? title.trim() : undefined,
        quotaLimit: quotaLimit !== undefined ? parseInt(quotaLimit, 10) : undefined,
        reportsToPositionId: reportsToPositionId !== undefined ? (reportsToPositionId || null) : undefined,
      },
      include: {
        department: true,
        reportsToPosition: true,
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lavozim ma\'lumotlari muvaffaqiyatli yangilandi!',
      position: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
