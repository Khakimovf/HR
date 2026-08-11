import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    const allowed = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Noto\'g\'ri status. Ruxsat etilganlar: ACTIVE, COMPLETED, CANCELLED' },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveAttendance.update({
      where: { id: params.id },
      data:  { status },
      include: { employee: true },
    });

    // If cancelling, restore employee status to ACTIVE
    if (status === 'CANCELLED') {
      const otherActiveLeaves = await prisma.leaveAttendance.count({
        where: {
          employeeId: leave.employeeId,
          id: { not: params.id },
          status: { in: ['ACTIVE', 'APPROVED'] },
          type: { in: ['MEHNAT_TATILI', 'BS_UNPAID', 'SICK_LEAVE_BL', 'OQISH_TATILI', 'ADMIN_TATIL', 'MT', 'BS', 'BL'] },
        },
      });

      if (otherActiveLeaves === 0) {
        await prisma.employee.update({
          where: { id: leave.employeeId },
          data:  { status: 'ACTIVE' },
        });
      }
    }

    return NextResponse.json({ success: true, leave });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leave = await prisma.leaveAttendance.findUnique({ where: { id: params.id } });
    if (!leave) return NextResponse.json({ success: false, error: 'Yozuv topilmadi' }, { status: 404 });

    await prisma.leaveAttendance.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
