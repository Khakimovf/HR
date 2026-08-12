import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateKpiScore } from '@/lib/kpi';

// Map LeaveRequest types to LeaveAttendance types
const TYPE_MAPPING: Record<string, string> = {
  BS_UNPAID: 'BS',
  MEHNAT_TATILI: 'MT',
  SICK_LEAVE_BL: 'BL',
  HOURLY_PERMIT: 'KECHIKISH_RUXSATNOMA',
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const requestId = params.id;
    const body = await req.json();
    const { approverName, comment, approverRole } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Ariza ID ko'rsatilmadi" }, { status: 400 });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: true,
        approvalSteps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Ariza topilmadi' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Ushbu ariza holati allaqachon ${request.status} bo'lgan` },
        { status: 400 }
      );
    }

    const currentStepNum = request.currentStep;
    const currentStepObj = request.approvalSteps.find((s) => s.stepNumber === currentStepNum);

    if (!currentStepObj) {
      return NextResponse.json({ success: false, error: 'Mos tasdiqlash bosqichi topilmadi' }, { status: 400 });
    }

    const now = new Date();
    const finalApproverName = approverName || 'Rahbar (Elektron Imzo)';

    // Update current approval step to APPROVED
    await prisma.leaveApprovalStep.update({
      where: { id: currentStepObj.id },
      data: {
        status: 'APPROVED',
        approverName: finalApproverName,
        comment: comment || 'Tasdiqlandi',
        actionDate: now,
      },
    });

    let updatedRequest;

    if (currentStepNum < 6) {
      // Advance to next step
      updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          currentStep: currentStepNum + 1,
        },
        include: {
          employee: { include: { currentDepartment: true } },
          approvalSteps: { orderBy: { stepNumber: 'asc' } },
        },
      });
    } else {
      // ── STEP 6 FINAL APPROVAL: AUTOMATIC SYSTEM INTEGRATION ────────────────
      updatedRequest = await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          currentStep: 6,
        },
        include: {
          employee: { include: { currentDepartment: true } },
          approvalSteps: { orderBy: { stepNumber: 'asc' } },
        },
      });

      // 1. Insert into LeaveAttendance (Davomat & Ta'tillar module)
      const davomatType = TYPE_MAPPING[request.type] || request.type;
      const orderNo = `ARIZ-${request.id.slice(0, 8).toUpperCase()}`;

      await prisma.leaveAttendance.create({
        data: {
          employeeId: request.employeeId,
          type: davomatType,
          startDate: request.startDate,
          endDate: request.endDate,
          totalDays: request.totalDays,
          orderNumber: orderNo,
          reason: `[Elektron Ariza #${orderNo}] ${request.reason}`,
          status: 'APPROVED',
        },
      });

      // 2. Update Employee Status if Long Leave
      if (['BS_UNPAID', 'MEHNAT_TATILI', 'SICK_LEAVE_BL'].includes(request.type)) {
        await prisma.employee.update({
          where: { id: request.employeeId },
          data: { status: 'ON_LEAVE' },
        });
      }

      // 3. Trigger auto-update for KPI Dvigateli
      const startD = new Date(request.startDate);
      const monthStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}`;

      // Recalculate KPI for this employee & month
      const empLeaves = await prisma.leaveAttendance.findMany({
        where: {
          employeeId: request.employeeId,
          startDate: {
            gte: new Date(startD.getFullYear(), startD.getMonth(), 1),
            lte: new Date(startD.getFullYear(), startD.getMonth() + 1, 0, 23, 59, 59),
          },
        },
      });

      const empDiscipline = await prisma.disciplinaryAction.findMany({
        where: { employeeId: request.employeeId, status: 'ACTIVE' },
      });

      const bsDays   = empLeaves.filter((l) => l.type === 'BS' || l.type === 'BS_UNPAID').reduce((s, l) => s + l.totalDays, 0);
      const blDays   = empLeaves.filter((l) => l.type === 'BL' || l.type === 'SICK_LEAVE_BL').reduce((s, l) => s + l.totalDays, 0);
      const lateHours = empLeaves.filter((l) => l.type === 'KECHIKISH_RUXSATNOMA' || l.type === 'LATE_ARRIVAL').reduce((s, l) => s + (l.hoursLate || 0), 0);
      const progulDays = empLeaves.filter((l) => l.type === 'PROGUL').reduce((s, l) => s + l.totalDays, 0);
      const hasActivePenalty = empDiscipline.length > 0;

      const kpiResult = calculateKpiScore({
        hasActiveDisciplinaryPenalty: hasActivePenalty,
        bsDays,
        blDays,
        lateHours,
        progulDays,
      });

      const baseBonus = 3500000;
      const finalBonus = kpiResult.disciplinaryLock ? 0 : Math.max(0, Math.round(baseBonus * (kpiResult.finalKpiPct / 100)));

      const existingKpi = await prisma.kpiRecord.findFirst({
        where: { employeeId: request.employeeId, month: monthStr },
      });

      if (existingKpi) {
        await prisma.kpiRecord.update({
          where: { id: existingKpi.id },
          data: {
            unworkedDays: bsDays,
            sickDays: blDays,
            lateHours,
            deductionPercentage: kpiResult.totalDeductionPct,
            finalBonus,
            attendanceRate: kpiResult.attendanceRate,
          },
        });
      } else {
        await prisma.kpiRecord.create({
          data: {
            employeeId: request.employeeId,
            month: monthStr,
            baseBonus,
            unworkedDays: bsDays,
            sickDays: blDays,
            lateHours,
            deductionPercentage: kpiResult.totalDeductionPct,
            finalBonus,
            attendanceRate: kpiResult.attendanceRate,
          },
        });
      }

      // Audit Log for final approval
      await prisma.auditLog.create({
        data: {
          hrName: finalApproverName,
          action: `Ta'til arizasi yakuniy tasdiqlandi (Bosqich 6 - Bosh Direktor). ID: #${request.id.slice(0, 8)}`,
          targetEmployeeId: request.employeeId,
          departmentName: request.employee?.currentDepartmentId || 'Direksiya',
          metadata: JSON.stringify({ requestId: request.id, totalDays: request.totalDays }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Bosqich ${currentStepNum} muvaffaqiyatli tasdiqlandi!`,
      request: updatedRequest,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
