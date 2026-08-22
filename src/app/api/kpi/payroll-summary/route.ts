import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const departmentId = searchParams.get('departmentId') || '';

    const empWhere: any = {
      status: 'ACTIVE',
    };
    if (departmentId) {
      empWhere.currentDepartmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: {
        id: true,
        tabelNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        position: true,
        baseSalary: true,
        currentDepartment: {
          select: { id: true, name: true, code: true },
        },
        kpiEvaluations: {
          where: { period },
          take: 1,
        },
      },
      orderBy: { tabelNumber: 'asc' },
    });

    const summaryRows = employees.map((emp) => {
      const baseSalary = emp.baseSalary || 4500000;
      const evaluation = emp.kpiEvaluations && emp.kpiEvaluations[0];
      const kpiScore = evaluation ? evaluation.totalScore : 0;

      // Enterprise Cut-off & Bonus Formula
      // IF KPI Score >= 50% THEN (20% * (KPI Score / 100)) ELSE 0%
      let bonusRatePct = 0;
      if (kpiScore >= 50) {
        bonusRatePct = Number((20 * (kpiScore / 100)).toFixed(2));
      }

      const bonusAmountUzs = Math.round(baseSalary * (bonusRatePct / 100));

      let status = 'UNSATISFACTORY';
      if (kpiScore >= 90) status = 'EXCELLENT';
      else if (kpiScore >= 70) status = 'GOOD';
      else if (kpiScore >= 50) status = 'AVERAGE';

      return {
        employeeId: emp.id,
        tabelNumber: emp.tabelNumber,
        fullName: `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim(),
        departmentName: emp.currentDepartment?.name || '—',
        departmentCode: emp.currentDepartment?.code || '—',
        position: emp.position,
        baseSalary,
        kpiScore,
        bonusRatePct,
        bonusAmountUzs,
        status,
        isEvaluated: !!evaluation,
      };
    });

    // Aggregates
    const totalBaseSalary = summaryRows.reduce((sum, r) => sum + r.baseSalary, 0);
    const totalBonusAmount = summaryRows.reduce((sum, r) => sum + r.bonusAmountUzs, 0);
    const avgKpiScore = summaryRows.length > 0
      ? Number((summaryRows.reduce((sum, r) => sum + r.kpiScore, 0) / summaryRows.length).toFixed(1))
      : 0;
    const eligibleCount = summaryRows.filter((r) => r.bonusAmountUzs > 0).length;

    return NextResponse.json({
      success: true,
      period,
      departmentId,
      stats: {
        totalEmployees: summaryRows.length,
        eligibleCount,
        totalBaseSalary,
        totalBonusAmount,
        avgKpiScore,
      },
      rows: summaryRows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
