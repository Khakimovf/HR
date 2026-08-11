import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      offboardedEmployees,
      departments,
      transfersToday,
      activeDisciplinaryActions,
      recentRewards,
      leavesSummary,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { status: 'OFFBOARDED' } }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { employees: true },
          },
        },
      }),
      prisma.departmentTransfer.count({
        where: {
          transferDate: {
            gte: today,
          },
        },
      }),
      prisma.disciplinaryAction.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.rewardFinancialAid.count(),
      prisma.leaveAttendance.groupBy({
        by: ['type'],
        _count: {
          _all: true,
        },
      }),
    ]);

    // Leaves detailed breakdown
    const leavesByType: Record<string, number> = {};
    leavesSummary.forEach((item) => {
      leavesByType[item.type] = item._count._all;
    });

    const departmentMetrics = departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      employeeCount: d._count.employees,
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        offboardedEmployees,
        transfersToday,
        activeDisciplinaryActions,
        recentRewards,
        leavesByType,
      },
      departmentMetrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
