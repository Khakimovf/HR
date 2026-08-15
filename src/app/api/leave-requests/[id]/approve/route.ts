import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateKpiScore } from '@/lib/kpi';
import { statsCache } from '@/lib/cache';

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
    const { approverName, comment } = body;

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

    let updatedRequest;

    if (currentStepNum < 6) {
      // Intermediate Step Approval Transaction
      const [stepRes, reqRes] = await prisma.$transaction([
        prisma.leaveApprovalStep.update({
          where: { id: currentStepObj.id },
          data: {
            status: 'APPROVED',
            approverName: finalApproverName,
            comment: comment || 'Tasdiqlandi',
            actionDate: now,
          },
        }),
        prisma.leaveRequest.update({
          where: { id: requestId },
          data: { currentStep: currentStepNum + 1 },
          include: {
            employee: { include: { currentDepartment: true } },
            approvalSteps: { orderBy: { stepNumber: 'asc' } },
          },
        }),
      ]);

      updatedRequest = reqRes;
    } else {
      // ── STEP 6 FINAL APPROVAL: ATOMIC PRISMA TRANSACTION CHAIN ─────────────
      const davomatType = TYPE_MAPPING[request.type] || request.type;
      const orderNo = `ARIZ-${request.id.slice(0, 8).toUpperCase()}`;

      const startD = new Date(request.startDate);
      const monthStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}`;

      // Calculate KPI metrics
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

      const bsDays = empLeaves.filter((l) => l.type === 'BS' || l.type === 'BS_UNPAID').reduce((s, l) => s + l.totalDays, 0);
      const blDays = empLeaves.filter((l) => l.type === 'BL' || l.type === 'SICK_LEAVE_BL').reduce((s, l) => s + l.totalDays, 0);
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

      // Perform all final approval mutations atomically
      const transactionOps: any[] = [
        // 1. Approve Step 6
        prisma.leaveApprovalStep.update({
          where: { id: currentStepObj.id },
          data: {
            status: 'APPROVED',
            approverName: finalApproverName,
            comment: comment || 'Tasdiqlandi',
            actionDate: now,
          },
        }),
        // 2. Mark Request Approved
        prisma.leaveRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', currentStep: 6 },
          include: {
            employee: { include: { currentDepartment: true } },
            approvalSteps: { orderBy: { stepNumber: 'asc' } },
          },
        }),
        // 3. Create LeaveAttendance record
        prisma.leaveAttendance.create({
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
        }),
        // 4. Create Audit Log
        prisma.auditLog.create({
          data: {
            hrName: finalApproverName,
            action: `Ta'til arizasi yakuniy tasdiqlandi (Bosqich 6 - Bosh Direktor). ID: #${request.id.slice(0, 8)}`,
            targetEmployeeId: request.employeeId,
            departmentName: request.employee?.currentDepartmentId || 'Direksiya',
            metadata: JSON.stringify({ requestId: request.id, totalDays: request.totalDays }),
          },
        }),
      ];

      // 5. Employee status update
      if (['BS_UNPAID', 'MEHNAT_TATILI', 'SICK_LEAVE_BL'].includes(request.type)) {
        transactionOps.push(
          prisma.employee.update({
            where: { id: request.employeeId },
            data: { status: 'ON_LEAVE' },
          })
        );
      }

      const txResults = await prisma.$transaction(transactionOps);
      updatedRequest = txResults[1];
    }

    // Invalidate analytics caches reactively
    statsCache.invalidate();

    return NextResponse.json({
      success: true,
      message: `Bosqich ${currentStepNum} muvaffaqiyatli tasdiqlandi!`,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error('Leave Request Approval Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
