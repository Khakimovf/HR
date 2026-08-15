import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statsCache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const departmentId = searchParams.get('departmentId') || '';

    const empWhere: any = {};
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
        currentDepartmentId: true,
        baseSalary: true,
        currentDepartment: {
          select: { id: true, name: true, code: true },
        },
        kpiEvaluations: {
          where: { period },
          include: { scores: true },
          take: 1,
        },
      },
      orderBy: { tabelNumber: 'asc' },
    });

    let template = null;
    if (departmentId) {
      template = await (prisma as any).kpiTemplate.findFirst({
        where: { departmentId },
        include: { criteria: true },
      });
    }

    return NextResponse.json({
      success: true,
      period,
      departmentId,
      template,
      employees,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { period, departmentId, evaluations } = body;

    if (!period || !Array.isArray(evaluations)) {
      return NextResponse.json(
        { success: false, error: "Davr (period) va xodimlarni baholash ma'lumotlari berilishi shart" },
        { status: 400 }
      );
    }

    const saved: any[] = [];

    // Process evaluations inside atomic transaction
    await prisma.$transaction(async (tx: any) => {
      for (const item of evaluations) {
        const { employeeId, totalScore, notes, criterionScores } = item;
        if (!employeeId) continue;

        const scoreNum = Math.min(100, Math.max(0, Number(totalScore) || 0));

        let status = 'UNSATISFACTORY';
        if (scoreNum >= 90) status = 'EXCELLENT';
        else if (scoreNum >= 70) status = 'GOOD';
        else if (scoreNum >= 50) status = 'AVERAGE';

        const existing = await tx.kpiEvaluation.findUnique({
          where: {
            employeeId_period: {
              employeeId,
              period,
            },
          },
        });

        let evaluation;
        const oldScoreVal = existing ? existing.totalScore : 0;

        if (existing) {
          await tx.kpiCriterionScore.deleteMany({
            where: { evaluationId: existing.id },
          });

          evaluation = await tx.kpiEvaluation.update({
            where: { id: existing.id },
            data: {
              totalScore: scoreNum,
              status,
              notes: notes || null,
              departmentId: departmentId || existing.departmentId,
              scores: Array.isArray(criterionScores)
                ? {
                    create: criterionScores.map((cs: any) => ({
                      criterionName: cs.criterionName || 'Mezon',
                      weight: Number(cs.weight) || 0,
                      score: Number(cs.score) || 0,
                    })),
                  }
                : undefined,
            },
            include: { scores: true },
          });
        } else {
          const emp = await tx.employee.findUnique({
            where: { id: employeeId },
            select: { currentDepartmentId: true },
          });

          evaluation = await tx.kpiEvaluation.create({
            data: {
              employeeId,
              period,
              departmentId: departmentId || emp?.currentDepartmentId || 'MAIN',
              totalScore: scoreNum,
              status,
              notes: notes || null,
              scores: Array.isArray(criterionScores)
                ? {
                    create: criterionScores.map((cs: any) => ({
                      criterionName: cs.criterionName || 'Mezon',
                      weight: Number(cs.weight) || 0,
                      score: Number(cs.score) || 0,
                    })),
                  }
                : undefined,
            },
            include: { scores: true },
          });
        }

        // Record Audit Log entry for KPI score change
        await tx.auditLog.create({
          data: {
            hrName: 'KPI Engine System',
            action: `Oylik KPI bahosi kiritildi/yangilandi (${period}): Score=${scoreNum}%`,
            targetEmployeeId: employeeId,
            departmentName: departmentId || 'MAIN',
            metadata: JSON.stringify({
              user_id: 'SYSTEM_KPI_ENGINE',
              field_name: 'kpi_totalScore',
              old_val: oldScoreVal,
              new_val: scoreNum,
              period,
              timestamp: new Date().toISOString(),
            }),
          },
        });

        saved.push(evaluation);
      }
    });

    // Invalidate analytics caches reactively
    statsCache.invalidate();

    return NextResponse.json({
      success: true,
      count: saved.length,
      evaluations: saved,
    });
  } catch (error: any) {
    console.error('KPI Evaluations Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
