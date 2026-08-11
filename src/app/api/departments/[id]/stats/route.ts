import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deptId = params.id;

    // Get all employees in this department with full details for modal table
    const employees = await prisma.employee.findMany({
      where: { currentDepartmentId: deptId },
      include: {
        permits: true,
        disciplinaryActions: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    const empIds = employees.map((e) => e.id);
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length;

    // Count currently active leave records per type
    const now = new Date();
    const activeLeaves = await prisma.leaveAttendance.groupBy({
      by: ['type'],
      where: {
        employeeId: { in: empIds },
        status: 'APPROVED',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      _count: { type: true },
    });

    const leaveMap: Record<string, number> = {};
    activeLeaves.forEach((l) => {
      leaveMap[l.type] = l._count.type;
    });

    // Active disciplinary actions
    const activePenalties = await prisma.disciplinaryAction.count({
      where: {
        employeeId: { in: empIds },
        status: 'ACTIVE',
      },
    });

    // Department info with parent
    const dept = await prisma.department.findUnique({
      where: { id: deptId },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees: employees.length,
        activeCount,
        onLeaveCount,
        leaveByType: {
          MT: leaveMap['MT'] || 0,
          BS: leaveMap['BS'] || 0,
          BL: leaveMap['BL'] || 0,
          STUDY_LEAVE: leaveMap['STUDY_LEAVE'] || 0,
          MILITARY_DUTY: leaveMap['MILITARY_DUTY'] || 0,
        },
        activePenalties,
        department: dept,
        employees, // Full employee roster for modal table
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
