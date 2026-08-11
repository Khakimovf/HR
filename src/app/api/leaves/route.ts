import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const leaves = await prisma.leaveAttendance.findMany({
      where,
      include: {
        employee: {
          include: { currentDepartment: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, leaves });
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
    const { employeeId, type, startDate, endDate, hoursLate, reason } = body;

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Xodim, ta\'til turi va sanalari ko\'rsatiliishi shart' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    const leaveRecord = await prisma.leaveAttendance.create({
      data: {
        employeeId,
        type: type,
        startDate: start,
        endDate: end,
        totalDays: type === 'LATE_ARRIVAL' ? 0 : totalDays,
        hoursLate: hoursLate ? parseFloat(hoursLate) : null,
        reason: reason || null,
        status: 'APPROVED',
      },
    });

    // Update employee status if long active leave
    if (['MT', 'BS', 'BL', 'STUDY_LEAVE', 'MILITARY_DUTY'].includes(type)) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: 'ON_LEAVE' },
      });
    }

    return NextResponse.json({ success: true, leave: leaveRecord });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
